# Avatar Virtuel — Assistant Conversationnel IA (Al Abass Omar)

Assistant conversationnel multimodal (texte / voix / avatar lip-sync) basé **strictement** sur une base de connaissances documentée. Aucune invention hors RAG.

## Stack

| Couche | Techno |
|--------|--------|
| Backend | Python FastAPI |
| Frontend | Next.js 14 (App Router) |
| DB | PostgreSQL + pgvector |
| STT | faster-whisper (dev) |
| LLM | Gemini 1.5 Flash (swappable) |
| TTS | edge-tts (dev) → ElevenLabs (démo) |
| Avatar | mock / HeyGen / D-ID |
| Infra | Docker Compose + Nginx |

## Démarrage rapide (local)

### Prérequis
- Docker & Docker Compose
- Clé API : `GEMINI_API_KEY` (LLM reformulation + embeddings)

### 1. Configuration

```bash
cp .env.example .env
# Éditer .env : GEMINI_API_KEY, secrets DB
# Rate limits locaux déjà confortables : 120/min chat, 60/min audio
```

### 2. Lancer les services

```bash
docker compose up --build -d
```

Si la KB n’est pas encore ingérée :

```bash
docker compose exec backend python -m scripts.ingest_knowledge
```

### 3. Ouvrir l’interface

| Service | URL |
|---------|-----|
| **UI (tests utilisateur)** | **http://localhost:3000** |
| API | http://localhost:8000 |
| Health | http://localhost:8000/api/v1/health |
| Docs OpenAPI | http://localhost:8000/docs (si `APP_DEBUG=true`) |

Sur `localhost`, chaque réponse affiche en petit `score=… · source=qa|document · lang=…` (aussi dans la console F12 → `[RAG]`). Les logs backend : `docker compose logs -f backend` (chercher `rag_chunk_retained`).

### 4. Arrêter

```bash
docker compose down
```

### 4. Variables importantes

Voir `.env.example`. Stack IA = **Gemini uniquement** (reformulation + embeddings) :
- `GEMINI_API_KEY` + `LLM_MODEL=gemini-3.6-flash`
- `EMBEDDING_PROVIDER=gemini` + `EMBEDDING_MODEL=gemini-embedding-001` + `EMBEDDING_DIMENSIONS=768`
- `TTS_PROVIDER=edge|espeak|elevenlabs`
- `AVATAR_PROVIDER=mock|heygen|did`
- `STT_PROVIDER=faster_whisper`

## Sécurité

- Secrets uniquement dans `.env` (jamais commités)
- Rate limiting sur `/chat/text` et `/chat/audio`
- CORS whitelist (pas de `*` en prod)
- Admin knowledge : header `X-Admin-Key`
- Sessions éphémères : purge après `SESSION_RETENTION_HOURS` (défaut 24h)
- HTTPS forcé via Nginx + Let's Encrypt en production

## Structure

Voir `AVANCEMENT.md` pour le suivi phase par phase.

## Tests

```bash
# Unitaires
docker compose exec backend pytest -v

# Les 3 packs Section 11 (fidèles + citoyen + hors périmètre)
docker compose exec backend python -m scripts.eval_section11
```

### Résultats mesurés (2026-09-07) — seuil RAG **0.65**, top-k **3**

| Pack | Objectif | Résultat |
|------|---------|----------|
| Paraphrases fidèles FR + Darija | ≥ 95 % | **100 %** |
| Questions naturelles citoyen | — | **100 %** sourcées |
| Hors périmètre | ≥ 90 % | **100 %** |
| Latence e2e avec média (mock) | < 6 s | **~1.7 s** |

F03 : traduction non-arabe → AR **uniquement pour la recherche RAG**.  
Log prod : `rag_chunk_retained score=…` sur chaque réponse.

## Production (VPS)

Procédure complète (sans coller d’identifiants SSH ici) : **[`deploy/README.md`](deploy/README.md)**

Résumé :
1. Copier le projet sur le VPS (`rsync` / git)
2. `cp .env.production.example .env` → secrets, `AVATAR_DOMAIN`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`
3. Certificats Let's Encrypt → `nginx/certs/` (voir `nginx/README.md`)
4. `chmod +x deploy/deploy.sh && ./deploy/deploy.sh`  
   ou : `docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up --build -d`
5. Ingestion : `docker compose … exec backend python -m scripts.ingest_knowledge`

ElevenLabs / HeyGen : à activer **seulement** le jour de la démo (variables dans `.env`).

## Providers (bascule .env uniquement)

| Variable | Dev / prod actuelle | Démo finale média |
|----------|---------------------|-------------------|
| `LLM_PROVIDER` | `gemini` | `gemini` |
| `EMBEDDING_PROVIDER` | `gemini` (`gemini-embedding-001`, 768-d) | `gemini` |
| `TTS_PROVIDER` | `edge` (+ fallback espeak) | `elevenlabs` |
| `AVATAR_PROVIDER` | `mock` | `heygen` ou `did` |
| `STT_PROVIDER` | `faster_whisper` | `faster_whisper` |

## Licence / usage

Usage interne de campagne — réponses limitées au programme documenté.
