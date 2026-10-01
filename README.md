# My Watchlist

Application web personnelle pour suivre les films, séries et animes que tu veux voir ou que tu as vus. Ajoute des amis pour découvrir leurs listes et copier des titres dans la tienne.

## Fonctionnalités

- **Recherche TMDB** : ajout de titres avec affiches, synopsis, genres et bandes-annonces
- **Suivi par statut** : À voir / En cours / Vu
- **Notes et commentaires** : note sur 10 et commentaire personnel
- **Suivi par saison** : cocher les saisons vues pour les séries et sagas
- **En ce moment** : épingler le titre en cours de visionnage
- **Système d'amis** : ajoute des amis, consulte leurs listes, copie un titre dans ta liste
- **Filtres et tri** : par type (film, série, anime, cartoon), tri par date, titre ou note
- **Inscription ouverte** : chacun crée son compte
- **Notifications push** : rappels pour les sorties à venir
- **PWA** : installable sur mobile

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Vercel Serverless Functions (Node.js) |
| Base de données | Neon Postgres (serverless) |
| Auth | bcrypt + JWT (cookies HttpOnly) |
| Notifications | Web Push API |
| Images | Sharp (optimisation) |
| Hébergement | Vercel |
