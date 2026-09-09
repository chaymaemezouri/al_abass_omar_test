# Déploiement VPS (Phase 8)

Procédure à exécuter **sur le serveur** (ou via votre propre SSH).  
**Ne jamais coller de mots de passe SSH / clés privées dans le chat Cursor.**

## Prérequis côté client

- VPS Linux (Docker + Docker Compose v2)
- Sous-domaine DNS en **A** (ou AAAA) vers l’IP du VPS
- Ports **80** et **443** ouverts
- Clé `GEMINI_API_KEY` (ElevenLabs / HeyGen seulement le jour J)

## 1. Copier le projet

```bash
# Exemple : depuis votre machine (adaptez user/host)
rsync -avz --exclude .git --exclude media --exclude nginx/certs \
  ./ user@VPS_IP:/opt/avatar-virtuel/
```

## 2. Environnement production

```bash
cd /opt/avatar-virtuel
cp .env.production.example .env
nano .env   # secrets forts, AVATAR_DOMAIN, CORS_ORIGINS, NEXT_PUBLIC_API_URL, GEMINI_API_KEY
```

Points critiques :
- `APP_DEBUG=false`
- `CORS_ORIGINS=https://votre-sous-domaine.tld` (pas de `*`)
- `RAG_SIMILARITY_THRESHOLD=0.65` / `RAG_TOP_K=3` (validés Section 11)
- `TTS_PROVIDER=edge` et `AVATAR_PROVIDER=mock` jusqu’à la démo média

## 3. Nginx + Let's Encrypt

1. Mettre `server_name votre-sous-domaine.tld;` dans `nginx/nginx.conf` (le script `deploy/deploy.sh` le fait si `AVATAR_DOMAIN` est défini).
2. Certificats :

```bash
sudo apt update && sudo apt install -y certbot
# :80 doit être libre pour --standalone
sudo certbot certonly --standalone -d votre-sous-domaine.tld
sudo mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/votre-sous-domaine.tld/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/votre-sous-domaine.tld/privkey.pem nginx/certs/
```

Détails aussi dans `nginx/README.md`.

## 4. Lancer la stack prod

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
# ou manuellement :
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up --build -d
```

Différences `docker-compose.prod.yml` :
- Postgres / backend / frontend **non exposés** sur l’hôte (accès via Nginx uniquement)
- Pas de bind-mount du code source (image immuable)
- Profil `production` active Nginx :80/:443

## 5. Ingestion KB

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend \
  python -m scripts.ingest_knowledge
```

## 6. Vérifications

```bash
curl -fsS https://votre-sous-domaine.tld/api/v1/health
curl -fsS https://votre-sous-domaine.tld/   # frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
# Chercher les lignes: rag_chunk_retained score=...
```

## 7. Renouvellement SSL

```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/votre-sous-domaine.tld/fullchain.pem /opt/avatar-virtuel/nginx/certs/
sudo cp /etc/letsencrypt/live/votre-sous-domaine.tld/privkey.pem /opt/avatar-virtuel/nginx/certs/
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production exec nginx nginx -s reload
```

## Démo média (plus tard)

Dans `.env` seulement :
- `TTS_PROVIDER=elevenlabs` + `ELEVENLABS_*`
- `AVATAR_PROVIDER=heygen` ou `did` + clés associées  
Puis `docker compose ... up -d --force-recreate backend` (pas de rebuild nécessaire si env seul).
