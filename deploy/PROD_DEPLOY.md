# Déploiement PRODUCTION — `al-abass-omar.academyskills.net`

Site officiel candidat. **Séparé** du test (`test-avatar` → port 3010).

| Env | Domaine | PM2 | Port |
|-----|---------|-----|------|
| Test | test-avatar.academyskills.net | avatar-candidat | 3010 |
| **Prod** | al-abass-omar.academyskills.net | al-abass-omar | 3011 |

API Avatar partagée : `https://api-avatar.academyskills.net` (Docker `:8001`).

---

## 1. Structure sur le VPS (user `deploy`)

```bash
sudo mkdir -p /var/www/al-abass-omar/{app,shared,logs}
sudo chown -R deploy:deploy /var/www/al-abass-omar
```

## 2. Cloner le repo (ou copier depuis le test)

```bash
cd /var/www/al-abass-omar
git clone git@github.com:chaymaemezouri/al_abass_omar_test.git app
# ou: git clone https://github.com/chaymaemezouri/al_abass_omar_test.git app
cd app
git checkout main
```

## 3. Fichier secrets prod

```bash
nano /var/www/al-abass-omar/shared/.env
```

Contenu minimal :

```bash
LOVABLE_API_KEY=
PORT=3011
HOST=127.0.0.1
VITE_AVATAR_API_URL=https://api-avatar.academyskills.net
VITE_HEYGEN_VIDEO=false
VITE_PRERECORDED_AVATAR=true
```

Vidéos (trop lourdes pour Git — copier une fois sur le VPS) :

```bash
# depuis votre PC (PowerShell), adapter l'hôte SSH
scp public/candidate-speaking/avatar-idle.png deploy@srv1940536:/var/www/al-abass-omar/app/public/candidate-speaking/
scp public/candidate-speaking/speak-1.mp4 deploy@srv1940536:/var/www/al-abass-omar/app/public/candidate-speaking/
scp public/candidate-speaking/speak-2.mp4 deploy@srv1940536:/var/www/al-abass-omar/app/public/candidate-speaking/
```

```bash
ln -sfn /var/www/al-abass-omar/shared/.env /var/www/al-abass-omar/app/.env
```

## 4. Build + PM2

```bash
cd /var/www/al-abass-omar/app
npm install --no-fund --no-audit
npm run build
pm2 start deploy/ecosystem.prod.config.cjs
pm2 save
```

## 5. Nginx (sudo — backup ancien site statique d'abord)

```bash
sudo cp /var/www/al-abass-omar/app/deploy/nginx/al-abass-omar.academyskills.net.conf \
  /etc/nginx/sites-available/al-abass-omar.conf
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Backend CORS (Avatar_Virtuel)

Dans `/var/www/avatar-candidat/app/Avatar_Virtuel/.env` :

```bash
CORS_ORIGINS=https://test-avatar.academyskills.net,https://api-avatar.academyskills.net,https://al-abass-omar.academyskills.net
```

```bash
cd /var/www/avatar-candidat/app/Avatar_Virtuel
docker compose up -d --force-recreate backend
```

## 7. Vérifier

```bash
curl -sS https://al-abass-omar.academyskills.net/api/health
curl -sS https://api-avatar.academyskills.net/api/v1/health
```

Navigateur : `https://al-abass-omar.academyskills.net/avatar`

## Mises à jour ultérieures

```bash
# Frontend prod
cd /var/www/al-abass-omar/app
git pull origin main
npm install --no-fund --no-audit
npm run build
pm2 reload al-abass-omar --update-env

# Backend API (réponses longues, RAG)
cd /var/www/avatar-candidat/app
git pull origin main
cd Avatar_Virtuel
docker compose up -d --build backend
curl -sS http://127.0.0.1:8001/api/v1/health
```
