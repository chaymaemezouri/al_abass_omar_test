#!/usr/bin/env bash
# Deploy Avatar Virtuel on a VPS (run ON the server, after git clone / rsync).
# Does NOT ask for or store SSH credentials — you connect yourself.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.production.example to .env and fill secrets."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

DOMAIN="${AVATAR_DOMAIN:-}"
if [[ -z "$DOMAIN" || "$DOMAIN" == YOUR_SUBDOMAIN.example.com ]]; then
  echo "Set AVATAR_DOMAIN in .env to your real subdomain."
  exit 1
fi

echo "==> Ensuring nginx server_name = $DOMAIN"
if grep -q "server_name" nginx/nginx.conf; then
  # Replace placeholder or previous server_name on SSL server block lines only carefully:
  sed -i.bak -E "s/server_name [^;]+;/server_name ${DOMAIN};/g" nginx/nginx.conf
fi

echo "==> Obtaining / refreshing Let's Encrypt cert (standalone needs free :80)"
if [[ ! -f nginx/certs/fullchain.pem || ! -f nginx/certs/privkey.pem ]]; then
  echo "Stopping containers that bind :80 if any..."
  docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production stop nginx 2>/dev/null || true
  sudo mkdir -p /etc/letsencrypt
  sudo certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos \
    -m "${LETSENCRYPT_EMAIL:-admin@$DOMAIN}" || {
      echo "certbot failed — run manually (see deploy/README.md)"
      exit 1
    }
  sudo mkdir -p nginx/certs
  sudo cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" nginx/certs/
  sudo cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" nginx/certs/
  sudo chmod 644 nginx/certs/fullchain.pem
  sudo chmod 600 nginx/certs/privkey.pem
fi

echo "==> Building & starting production stack"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up --build -d

echo "==> Waiting for backend health"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:8000/api/v1/health" >/dev/null 2>&1 || \
     curl -fsS "https://${DOMAIN}/api/v1/health" >/dev/null 2>&1; then
    echo "Health OK"
    break
  fi
  sleep 2
done

echo "==> Ingest knowledge (idempotent)"
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend \
  python -m scripts.ingest_knowledge || true

echo "Done. Open https://${DOMAIN}"
