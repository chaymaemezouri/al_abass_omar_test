# Intégration dans le site campagne

Le site TanStack (`/`) ouvre l’expérience IA sur **`/avatar`**.

## Flux

1. CTA « اطرح سؤالك » / chat → navigation vers `/avatar` (option `?q=`).
2. La page `/avatar` appelle le backend FastAPI `Avatar_Virtuel` :
   - `POST /api/v1/chat/text`
   - `POST /api/v1/chat/audio`
3. URL API via `VITE_AVATAR_API_URL` (défaut local `http://localhost:8000`).

## Démarrage local

Terminal A — backend avatar :

```bash
cd Avatar_Virtuel
cp .env.example .env   # puis renseigner GEMINI_API_KEY, etc.
docker compose up --build -d
```

Terminal B — site :

```bash
# à la racine Projet_AV
echo VITE_AVATAR_API_URL=http://localhost:8000 >> .env
npm run dev
```

Ouvrir http://localhost:8080/ puis cliquer « اطرح سؤالك » → http://localhost:8080/avatar

## Production

- Site : déjà déployé (PM2 / Nginx).
- Backend avatar : déployer séparément (voir `Avatar_Virtuel/deploy/README.md`).
- Sur le VPS du site, définir `VITE_AVATAR_API_URL=https://<api-avatar>` **avant** `npm run build` (variable Vite build-time).
- CORS backend : autoriser l’origine du site (`https://test-avatar.academyskills.net`).
