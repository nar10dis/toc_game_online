# Backend

Le backend est développé avec **NestJS**, **Prisma** et **PostgreSQL**.

## Lancer le backend

Le backend et PostgreSQL tournent dans Docker.

Depuis le dossier racine du projet :
- docker compose up

Ou en arrière-plan :
- docker compose up -d

---

## Prisma

**Prisma** outil qui permet au backend de communiquer avec notre base de données PostgreSQL.

Le fichier principal est :
    - backend/prisma/schema.prisma

C'est dans ce fichier que sont définis les modèles de données de l'application (les tables)

model User {
  id       Int    @id @default(autoincrement())
  username String
  email    String @unique
}
--> correspond aux données qu'on veut stocker pour un utilisateur.

### Modifier les modèles

Lorsqu'un modèle est ajouté ou modifié dans `schema.prisma`, il faut créer une migration afin d'appliquer le changement à la base PostgreSQL :

```bash
docker compose exec backend npx prisma migrate dev --name <nom-de-la-migration>
```

Par exemple :

```bash
docker compose exec backend npx prisma migrate dev --name add-user-avatar
```

Si nécessaire, le client Prisma peut ensuite être régénéré :

```bash
docker compose exec backend npx prisma generate
```

Les migrations sont stockées dans :
    - backend/prisma/migrations/

Les fichiers de migration doivent être commités dans Git.

---

## Base de données

Nous utilisons **PostgreSQL** pour stocker les données.

La configuration se trouve dans le fichier `.env`.

Fichier `.env.example` (a recreer):

POSTGRES_USER=postgres
POSTGRES_PASSWORD=********
POSTGRES_DB=myapp

---

## Communication Frontend ↔ Backend

Le frontend et le backend communiquent via une **API HTTP**.

Le frontend envoie une requête au backend, et le backend lui renvoie une réponse.

Navigateur
    │
    │
    ▼
Frontend
    │
    │ HTTP request
    ▼
Backend (NestJS)
    │
    │
    ▼
PostgreSQL

Le frontend ne communique donc pas directement avec PostgreSQL.

### Premier endpoint : `/health`

Pour tester la communication entre le frontend et le backend, premier endpoint crée dans NestJS :

```typescript
@Get('health')
getHealth() {
  return { message: 'ok' };
}
```

Cet endpoint répond à une requête :

```http
GET /health
```

et renvoie :

```json
{
  "message": "ok"
}
```

Ce endpoint sert principalement à vérifier que le backend est bien lancé et que le frontend arrive à communiquer avec lui.

Pour les futures fonctionnalités, nous ajouterons d'autres endpoints de la même manière.

Par exemple :

```text
/api/users
/api/auth
/api/games
...
```

Le frontend appellera ces routes et le backend se chargera ensuite de récupérer ou modifier les données nécessaires.

### Test dans le navigateur

Lorsque le projet est lancé, on peut ouvrir l'application dans un navigateur.

Si la communication fonctionne correctement, la page affiche :

```text
Transcendence
---

Pour tester la communication entre le front et le back : 
https://localhost/api/health

## Commandes utiles

### Démarrer les containers

```bash
docker compose up
```

### Démarrer en arrière-plan

```bash
docker compose up -d
```

### Arrêter les containers

```bash
docker compose down
```

### Créer une migration

```bash
docker compose exec backend npx prisma migrate dev --name <nom>
```

### Régénérer Prisma Client

```bash
docker compose exec backend npx prisma generate
```

### Ouvrir Prisma Studio

Prisma Studio permet de consulter les données de la base avec une interface graphique :

```bash
docker compose exec backend npx prisma studio
```
