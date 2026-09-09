# AVANCEMENT DU PROJET — Assistant Conversationnel IA Avatar Candidat

Dernière mise à jour : 2026-09-07

## Statut global : Routage conversationnel LLM + RAG 0.65 validés — tests locaux OK ; médias payants / VPS en attente

---

## A) Ce qui est fonctionnel et testé

### Phase 0–1 — Setup & sécurité ✅
Docker Compose, FastAPI, CORS, rate limit, admin key, sessions éphémères.

### Phase 2 — Base de connaissances ✅ (Gemini embeddings)
**Sources strictes :** Q/R 120 + PDF programme (dédupliqué). Embeddings Gemini 768-d. Ingestion : `qa=120` + `document=34`.

### Phase 3 — LLM reformulateur ✅
Gemini `gemini-3.6-flash` ; reformulation stricte ; guardrails anti-chiffres inventés.

### Phase 3bis — Pont traduction RAG (F03) ✅
Traduction FR/Darija → AR **uniquement pour la recherche** (`TRANSLATION_MODEL=gemini-3.5-flash-lite`).

### Phase 3ter — Routage conversationnel vs programme ✅
- **Pas de phrases fixes** par langue (bonjour/merci/etc.)
- Classification LLM légère (`intent.py`, modèle lite) → `programme` | `conversationnel`
- Mélange (salut + question de fond) → **programme** (extraction de la partie fond + double tentative de recherche si besoin)
- Branche conversationnelle : génération libre bornée au **rôle** de l’assistant (pas de faits programme)
- Garde-fou : chiffre / réponse trop longue → re-route RAG **seulement** s’il y a de la substance programme ; sinon retry conversationnel (jamais le fallback « je n’ai pas cette information » pour un simple salut)
- Pipeline RAG programme **inchangé** (seuil 0.65, top-3, 1 chunk, reformulation)
- Logs : `intent_classified`, `rag_chunk_retained outcome=conversational|…`
- Script : `backend/scripts/eval_intent_routing.py`
- Smoke naturel (11 formulations FR/AR/Darija) : **conversationnel 100 %**, **programme 100 %** — aucune salutation simple en fallback RAG

### Profiling latence (chrono par étape) ✅
Instrumenté : `latency.py` + logs `latency_profile` ; champ `latency` dans la réponse API si `APP_DEBUG=true`. Script : `python -m scripts.profile_latency`.

**Mesure 2026-09-07 (local, Gemini free tier) — question programme FR + médias :**

| Étape | Temps | Part |
|-------|------:|-----:|
| **reformulate** (LLM) | **4,08 s** | **48,5 %** |
| intent_classify | 1,65 s | 19,7 % |
| translate | 0,76 s | 9,0 % |
| extract_query | 0,69 s | 8,2 % |
| tts | 0,57 s | 6,8 % |
| embedding | 0,42 s | 5,0 % |
| avatar (mock) | 0,20 s | 2,3 % |
| rag_search (pgvector) | 0,04 s | 0,4 % |
| **TOTAL** | **~8,8 s** | 100 % |

**Verdict :** le temps part surtout dans les **appels LLM Gemini** (reformulation ≫ reste). RAG DB est négligeable (~40 ms). Sur AR, un pic reformulate à ~15 s observé (quota/variabilité free tier). Chemin conversationnel ~2,3 s (classify + reply + TTS + avatar). Sans médias, programme FR ~5,9 s (toujours dominé par reformulate ~54 %).

### Phase 4–6 — Médias & frontend ✅ (providers dev)
STT faster-whisper, TTS **espeak** en local (Edge 403 systématique depuis Docker → latence inutile évitée), avatar mock, Next.js :3000.  
Interface provider toujours swappable (`TTS_PROVIDER=edge|espeak|elevenlabs`).  
Mesure TTS seule (3 runs) : **edge+fallback ~1,17 s** → **espeak direct ~0,55 s** (**−53 %**).

### Phase 7 — Eval Section 11 (après seuil 0.65) ✅

#### Mesure préalable hors périmètre (avant implémentation)
Jeu OOS Phase 7 (15 questions). Scores max observés **≤ 0,6175**.

| Seuil candidat | Faux acceptés | Détection OOS |
|----------------|---------------|---------------|
| 0.65 | 0/15 | **100 %** |
| 0.68 | 0/15 | **100 %** |
| 0.70 | 0/15 | **100 %** |
| 0.72 | 0/15 | **100 %** |
| 0.75 | 0/15 | **100 %** |

**Seuil retenu :** **0.65** (le plus bas de {0.65, 0.68, 0.70, 0.72} avec OOS ≥ 90 %).

#### Implémentation
- `RAG_SIMILARITY_THRESHOLD=0.65`, `RAG_TOP_K=3` (ranking)
- Réponse = **1 chunk principal** uniquement (pas de fusion multi-chunks)
- Log prod permanent : `rag_chunk_retained outcome=… score=…` (answer / fallback / blocked)

#### Tableau Section 11 (3 jeux côte à côte, post-implémentation)

| Pack | Objectif | Résultat |
|------|---------|----------|
| Paraphrases fidèles FR + Darija | ≥ 95 % sourcées | **100 %** (30/30) |
| Questions naturelles citoyen | rappel utile | **100 %** sourcées (18/18) — était 16,7 % @0.75 |
| Hors périmètre | ≥ 90 % | **100 %** (15/15) |

Script : `backend/scripts/eval_section11.py` (+ `measure_oos_thresholds.py`, `eval_natural_citizen.py`).

### Phase 8 — Déploiement VPS 🔄 (préparé, à exécuter chez toi)
Prêt dans le repo (sans credentials dans le chat) :
- `docker-compose.prod.yml` (ports app/DB non exposés ; Nginx seul)
- `.env.production.example`
- `nginx/nginx.conf` + Let's Encrypt (`nginx/README.md`)
- Procédure : **`deploy/README.md`** + script **`deploy/deploy.sh`**

À faire **localement sur le VPS** : renseigner `AVATAR_DOMAIN` / secrets, certbot, `./deploy/deploy.sh`.

---

## B) Reste à faire

1. Exécuter le déploiement VPS (DNS + `.env` prod + certbot) — **de ton côté**
2. Jour J démo : activer ElevenLabs + HeyGen/D-ID dans `.env`
3. Grep final « pas de clés en dur »
4. Test charge en prod + surveillance logs `rag_chunk_retained`

---

## C) Ce dont j’ai encore besoin de ta part

### Plus besoin
- ~~Gemini~~, ~~pont F03~~, ~~décision seuil / top-k~~

### Encore nécessaire
1. Appliquer toi-même le déploiement (IP/SSH/domaine — **ne pas les coller ici**)
2. `ELEVENLABS_*` + HeyGen/D-ID **le jour J uniquement**
3. (Souhaitable) revue darija native

---

## D) Blocages actuels

| Blocage | Impact | Contournement |
|---------|--------|---------------|
| Quota Gemini free tier | Pics latence | Retry + modèle lite trad |
| Médias payants non branchés | Pas de voix clonée / lip-sync | mock jusqu’au jour J |
| Déploiement VPS à lancer chez toi | Pas encore HTTPS public | procédure `deploy/` prête |

---

## Écarts vs cahier des charges initial

- Double source RAG ; embeddings Gemini 768-d
- Traduction requête → AR pour recherche multilingue
- Seuil sélection **0.65** + top-3 ranking / 1 chunk réponse (validé OOS)
- Routage LLM conversationnel vs programme (pas de templates de politesse)
- Providers média payants reportés au jour J

---

## Prochaine étape immédiate

1. Déployer sur le VPS via `deploy/README.md` (domaine + secrets en local)
2. Surveiller `rag_chunk_retained` en prod
3. Préparer les clés ElevenLabs / HeyGen pour le jour J
