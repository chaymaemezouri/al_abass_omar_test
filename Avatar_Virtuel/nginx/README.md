# Certificats SSL (production)

Voir aussi la procédure complète : [`deploy/README.md`](../deploy/README.md).

## Option A — Let's Encrypt (recommandé)

Sur le VPS, DNS du sous-domaine déjà pointé vers l’IP :

```bash
sudo apt install certbot
# Libérer le port 80 si Nginx tourne déjà
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production stop nginx

sudo certbot certonly --standalone -d VOTRE_SOUS_DOMAINE.tld
sudo mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/VOTRE_SOUS_DOMAINE.tld/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/VOTRE_SOUS_DOMAINE.tld/privkey.pem nginx/certs/
```

Dans `nginx/nginx.conf`, remplacer `YOUR_SUBDOMAIN.example.com` par le vrai sous-domaine  
(ou lancer `./deploy/deploy.sh` avec `AVATAR_DOMAIN` renseigné).

Puis :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
```

## Option B — Certificat auto-signé (dev local uniquement)

```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/CN=localhost"
```

**Ne jamais committer de clés privées.**
