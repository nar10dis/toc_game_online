# Guide des logs (pino → Logstash → Elasticsearch → Kibana)

Ce guide explique comment les erreurs du backend arrivent dans Kibana, qui logge quoi, et comment lire et tester les logs.

---

## 1. Le trajet d'un log

```
NestJS (pino)  ──tcp:5000──►  Logstash  ──►  Elasticsearch  ──►  Kibana
nginx          ──syslog:5140─►    │           index app-logs-YYYY.MM.dd
```

- **Backend** : `nestjs-pino` écrit chaque log en JSON sur stdout (`docker logs backend`) **et** l'envoie à Logstash via `pino-socket` (`backend/src/config/logger.config.ts`). Logstash ajoute `service: "backend"`.
- **nginx** : les access logs partent en syslog. Logstash ajoute `service: "nginx"` et parse le JSON du `log_format`.
- Logstash ne renomme aucun champ du backend : ce que tu passes à `this.logger.xxx({...})` arrive tel quel dans Kibana.

---

## 2. Les niveaux

L'échelle est celle de **pino**, personne ne l'a choisie dans le projet. nestjs-pino traduit les méthodes de Nest vers ces niveaux :

| Méthode Nest | Niveau pino | `level` dans Kibana | Quand l'utiliser |
|---|---|---|---|
| `logger.verbose()` | trace | 10 | jamais gardé (seuil = debug) |
| `logger.debug()` | debug | 20 | détail utile pour déboguer, sans conséquence |
| `logger.log()` | info | 30 | événement normal qu'on veut voir passer |
| `logger.warn()` | warn | 40 | refus « normal » : faute du client, mauvais JWT, coup illégal |
| `logger.error()` | error | 50 | **bug** ou panne : c'est à nous de corriger |

Piège : `log()` donne **info** (30). Il n'existe pas de niveau « log » dans pino.

Le seuil se règle dans `logger.config.ts` (`level: 'debug'`) : tout ce qui est **≥ 20** est gardé.

---

## 3. Qui logge quoi

| D'où vient l'erreur | Qui la logge | Message (`msg`) | `context` |
|---|---|---|---|
| Toute requête HTTP | **pino-http**, automatique | `request completed` / `request errored` | — |
| `throw` pendant une requête HTTP | **`AllExceptionFilter`**, automatique | `request refused` (< 500, warn) / `unhandled error` (500, error) | `HTTP` |
| Événements WebSocket du jeu | **`GameGateway`**, à la main | `ws event refused` (warn) / `ws event crashed` (error) / `ws connection refused: invalid jwt` (warn) | `GameGateway` |
| WebSocket des amis | **`FriendsGateway`**, à la main | `ws connection refused: invalid jwt` (warn) / `notifyFriendsOf failed` (error) | `FriendsGateway` |
| Code en arrière-plan (bots, timers) | **`GameService`**, à la main | `runBots crashed` / `bot could not play` (error), `player disconnected, AI takes over` / `player reconnected` / `game abandoned: no human left` (info), `abandonGame: DB update failed` (error) | `GameService` |
| Demande d'ami rejouée (conflit Postgres) | **`FriendsService`** | `friend request retried after conflict` (debug) | `FriendsService` |
| Chaque coup joué (humain ou bot) | **`GameService.commit()`** | `move played` (debug) : `gameId`, `seat`, `action`, `captured`, `newRound`, `winner` | `GameService` |

### Pourquoi les deux premiers ne suffisent pas

pino-http et `AllExceptionFilter` ne voient **que les requêtes HTTP**. Ils ne voient pas :

- **les WebSockets** : un coup joué passe par socket.io, pas par HTTP ;
- **le code lancé sans `await`** : `POST /start` répond 201 tout de suite, puis `runBots` joue les bots pendant plusieurs secondes. Si ça plante à ce moment-là, la requête est déjà finie et personne n'écoute.

Pour ces cas, il faut un `try/catch` (ou un `.catch()`) **et** un `this.logger.error(...)` à la main. Sans ça, l'erreur disparaît en silence.

### Une requête refusée = 2 lignes

Un `throw new NotFoundException(...)` dans un controller produit :

1. `request refused` (AllExceptionFilter) : le **pourquoi**, avec `err.message` et `status` ;
2. `request completed` (pino-http) : le **résultat**, avec `res.statusCode`.

Les deux ont le **même `req.id`**, c'est comme ça qu'on les relie.

---

## 4. Ce qui a été ajouté (debrief)

| Fichier | Changement |
|---|---|
| `config/logger.config.ts` | pino-http branché sur Logstash, `customLogLevel` (5xx → error, 4xx → warn, sinon info), `redact` des cookies et du header `authorization` (**jamais de JWT dans les logs**) |
| `config/all-exceptions.filter.ts` | logge toute exception HTTP avec `status`, `method`, `url` et `err` |
| `game/game.service.ts` | `startBots()` : lance `runBots` avec un `.catch` qui logge `runBots crashed` (remplace les 3 `void this.runBots(...)`) |
| | `bot could not play` (error) : l'IA ne trouve pas de coup ou le moteur le refuse ; avant, c'était un `break` silencieux et la partie restait bloquée |
| | `player disconnected, AI takes over` / `player reconnected` / `game abandoned: no human left` (info) |
| | `abandonGame` : `console.error` remplacé par `this.logger.error` (un `console.error` n'arrive pas dans Kibana) |
| `game/game.gateway.ts` | `logWsError()` : même règle que le filtre HTTP (`HttpException` → warn, le reste → error) pour les événements `action` et `chat` |
| | handshake refusé (JWT invalide ou absent) → warn |
| `friends/friends.gateway.ts` | handshake refusé → warn ; `notifyFriendsOf` dans un `try/catch` (avant, une panne de la base à la connexion devenait une promesse rejetée que personne ne voyait) |
| `friends/friends.service.ts` | retry d'une demande d'ami après un conflit de transaction → debug |
| `game/game.service.ts` | `move played` (debug) dans `commit()` : chaque coup, pour retracer une partie en filtrant sur `gameId` |

**Volontairement non loggé :**

- Les `throw new XxxException(...)` des services HTTP : `AllExceptionFilter` les logge déjà.
- `sync` / `chat-sync` sans partie, `handleDisconnect` d'un socket jamais authentifié : c'est le fonctionnement normal.
- Les `return null` du moteur (`engine/`) : ce sont des coups illégaux, déjà loggés au niveau de la gateway (`ws event refused`).
- Le contenu des messages de chat, les mots de passe, les tokens, les emails.

---

## 5. Kibana

### Colonnes (dans cet ordre)

| # | Backend | nginx |
|---|---|---|
| 1 | `@timestamp` | `@timestamp` |
| 2 | `level` | — |
| 3 | `context` | — |
| 4 | `req.method` | `request` (« GET /url HTTP/1.1 ») |
| 5 | `req.url` | |
| 6 | `res.statusCode` / `status` | `status` |
| 7 | `responseTime` | `request_time` |
| 8 | `msg` | — |
| 9 | `err.message` | — |
| 10 | `gameId`, `userId`, `seat`, `actionType` | — |
| 11 | `req.id` | — |

`res.statusCode` est rempli par pino-http, `status` par `AllExceptionFilter` et `logWsError`.

### Filtres KQL utiles

```
service : "backend"                                  # tout le backend
service : "backend" and level >= 50                  # les bugs (à garder en recherche sauvegardée)
service : "backend" and level >= 40                  # bugs + refus
context : "GameService"                              # vie des parties : bots, déconnexions, abandons
context : "GameGateway" or context : "FriendsGateway"  # WebSockets
service : "backend" and req.method : *               # requêtes HTTP seulement
gameId : 3                                           # tout ce qui concerne la partie 3
req.id : 21                                          # toutes les lignes d'une même requête HTTP
not request : "/_next/hmr"                           # cache le bruit du hot reload Next.js
```

### Si un champ n'apparaît pas

Stack Management → Data Views → `app-logs-*` → bouton refresh (🔄). Kibana ne découvre les nouveaux champs qu'après ce refresh.

---

## 6. Ajouter un log

```ts
import { Logger } from '@nestjs/common';

export class MonService {
    private readonly logger = new Logger('MonService');   // = champ "context" dans Kibana

    async faireUnTruc(gameId: number) {
        try {
            // ...
        }
        catch (err) {
            this.logger.error({ err, gameId }, 'faireUnTruc failed');
        }
    }
}
```

- 1er argument : un **objet**. Chaque clé devient un champ Kibana. Mets l'erreur sous la clé **`err`** : pino en tire `err.message`, `err.type` et `err.stack`.
- 2e argument : le **message** (`msg`). Il doit être court, en anglais, et ne pas changer d'un appel à l'autre (les valeurs vont dans l'objet, pas dans le message). C'est ce qui permet de filtrer avec `msg : "runBots crashed"`.
- Une promesse lancée sans `await` : `maPromesse().catch(err => this.logger.error({ err }, '...'))`. **Jamais de `void maPromesse()`** pour du code qui peut planter.
- **Jamais** de `console.log` / `console.error` : ils ne passent pas par pino et n'arrivent pas dans Kibana.
- **Jamais** de mot de passe, token, cookie ou email dans l'objet.

---

## 7. Tester

| Cas | Comment | Attendu dans Kibana |
|---|---|---|
| 404 HTTP | rejoindre une partie avec un faux code | `request refused` + `request completed` 404, `level` 40, même `req.id` |
| Coup refusé (WS) | jouer quand ce n'est pas son tour | `ws event refused`, `status` 409, `level` 40 |
| JWT invalide (WS) | ouvrir `/ws/socket.io` sans cookie | `ws connection refused: invalid jwt`, `level` 40 |
| Déconnexion | fermer l'onglet en pleine partie, attendre 5 s | `player disconnected, AI takes over`, `level` 30 |
| Crash des bots | mettre temporairement `if (gameId >= 0) throw new Error('test');` au début de `runBots` | `runBots crashed`, `level` 50, `err.stack` |

Pour le test du crash : un `throw` **seul** en début de fonction rend la suite inatteignable, et TypeScript refuse alors de compiler (`'game' is possibly 'null'`). C'est pour ça qu'il faut le mettre dans un `if`. **Enlève-le après le test.**

---

## 8. Pièges rencontrés

- **Le backend ne recompile pas après une sauvegarde.** Le projet est sur sgoinfre (NFS) et le watcher de Nest ne voit pas toujours les modifications. Si `docker logs --tail 5 backend` n'affiche pas de `File change detected` : `docker restart backend`.
- **Rien dans Kibana alors que le code a l'air bon.** Vérifie d'abord que le backend compile (`Found 0 errors` dans `docker logs backend`). Un backend qui ne compile pas ne logge rien.
- **Kibana n'affiche que des `(null)`.** Ce sont des lignes nginx : elles n'ont pas les champs `req.*`. Filtre sur `service : "backend"` ou ajoute les colonnes nginx (`request`, `status`).
- **Le haut de la liste est rempli de `GET /_next/hmr` 404.** C'est le hot reload de Next.js qui n'arrive pas à ouvrir son WebSocket à travers nginx. Il ne s'agit pas d'une erreur de l'application : filtre avec `not request : "/_next/hmr"`.
- **Un redémarrage du backend vide les parties en cours** (elles vivent dans une `Map` en mémoire).
