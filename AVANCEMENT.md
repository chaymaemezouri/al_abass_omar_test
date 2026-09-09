# Avancement — Avatar candidat (test)

## Environnement

| Élément | Valeur |
|--------|--------|
| Repo | `https://github.com/chaymaemezouri/al_abass_omar_test` |
| Domaine TEST | `https://test-avatar.academyskills.net` |
| VPS path | `/var/www/avatar-candidat/` |
| Runtime | Node 22 + Nginx + PM2 (`avatar-candidat`, port 3010) |
| Branche déployée | `main` |

## Fait

- [x] Application TanStack Start (landing + chat)
- [x] Repo GitHub personnel
- [x] Isolation VPS (`/var/www/avatar-candidat`, user `deploy`, port 3010)
- [x] Build Nitro preset `node-server` (VPS)
- [x] Endpoint health `GET /api/health`
- [x] Workflow GitHub Actions TEST (`.github/workflows/deploy-test.yml`)
- [x] Doc ops `deploy/CI_CD.md` + `deploy/ecosystem.config.cjs` + modèle Nginx
- [x] Intégration **Avatar Virtuel** : page `/avatar` + CTA « اطرح سؤالك » → IA
- [x] Dossier source `Avatar_Virtuel/` (backend FastAPI + KB) dans le monorepo

## À finaliser côté ops

- [ ] Secrets GitHub Actions (`VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY`, …)
- [ ] Clé SSH ed25519 dédiée pour `deploy` + test de connexion
- [ ] Premier run Actions vert + healthcheck HTTPS OK
- [ ] Durcissement SSH (désactiver root/password une fois la clé validée)
- [ ] Déployer le **backend** Avatar Virtuel sur le VPS + `VITE_AVATAR_API_URL` (CORS)

## Hors scope TEST (plus tard)

- [ ] Domaine officiel candidat (prod) — pipeline et secrets séparés
- [ ] Branche `test-deploy` optionnelle si on veut découpler `main` du déploiement auto
