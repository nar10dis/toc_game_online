# Remarques

le .env est envoyé sur git, avec donc:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=1312
POSTGRES_DB=myapp
```

9. Une faiblesse repérée - auth

Les données d'inscription ne sont pas contrôlées. RegisterDTO décrit la forme attendue mais rien ne la vérifie, et ...data recopie tout ce que le navigateur envoie directement vers la base. Il n'y a par exemple aucune longueur minimale de mot de passe à l'inscription, alors que changePassword en impose une de 8 caractères. On le notera pour le bilan final.

POST https://localhost:8443/api/game/create/

navigateur ── cookie jwt périmé ──▶ AuthGuard ──▶ 401
navigateur ── POST /api/auth/refresh (cookie refresh_token) ──▶ nouveaux cookies
navigateur ── rejoue la requête de départ ──▶ AuthGuard ── req.Alice = {sub, username} ──▶ GameController

Alice ne verra aucune des etape intermédiaire du check cookie.
