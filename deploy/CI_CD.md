# CI/CD — environnement TEST (`test-avatar.academyskills.net`)

Ce pipeline déploie **uniquement** l’environnement de test :

- Domaine : `https://test-avatar.academyskills.net`
- Repo GitHub : `chaymaemezouri/al_abass_omar_test`
- Branche déclencheuse : `main`
- Chemin VPS : `/var/www/avatar-candidat/app`
- Process PM2 : `avatar-candidat` (port `3010`, localhost)
- Workflow : `.github/workflows/deploy-test.yml`

Ne pas réutiliser ces secrets / ce workflow pour un futur domaine de production candidat.

---

## Prérequis VPS (déjà en place ou à vérifier)

1. User SSH `deploy` (non-root) avec clé ed25519.
2. App clonée dans `/var/www/avatar-candidat/app`.
3. Fichier secrets **uniquement sur le VPS** :

```bash
/var/www/avatar-candidat/shared/.env
```

Exemple (valeurs réelles à saisir sur le serveur, jamais dans le chat ni dans Git) :

```bash
LOVABLE_API_KEY=...
PORT=3010
HOST=127.0.0.1
```

Symlink :

```bash
ln -sfn /var/www/avatar-candidat/shared/.env /var/www/avatar-candidat/app/.env
```

4. Nginx + TLS pour `test-avatar.academyskills.net` → `127.0.0.1:3010`  
   (modèle : `deploy/nginx/test-avatar.academyskills.net.conf`).
5. PM2 lancé sous l’utilisateur `deploy` (pas le PM2 root des autres projets).

---

## Secrets GitHub Actions

Dans le repo GitHub → **Settings → Secrets and variables → Actions** → **New repository secret**.

| Secret | Contenu |
|--------|---------|
| `VPS_HOST` | IP du VPS (ex. celle du DNS A de test-avatar) |
| `VPS_USER` | `deploy` |
| `VPS_PORT` | `22` (ou le port SSH réel) |
| `VPS_SSH_KEY` | Contenu **complet** de la clé **privée** ed25519 dédiée au déploiement |
| `DEPLOY_PATH` | `/var/www/avatar-candidat/app` (optionnel si tu gardes ce chemin) |
| `HEALTHCHECK_URL` | `https://test-avatar.academyskills.net/api/health` (optionnel) |

### Créer la clé de déploiement (sur ta machine locale)

```bash
ssh-keygen -t ed25519 -f ./avatar_deploy_ed25519 -C "github-actions-test-avatar"
```

1. Ajoute le contenu de `avatar_deploy_ed25519.pub` dans `/home/deploy/.ssh/authorized_keys` sur le VPS.
2. Mets le contenu de `avatar_deploy_ed25519` (clé **privée**) dans le secret GitHub `VPS_SSH_KEY`.
3. Ne committe jamais ces fichiers. Ne les colle jamais dans un chat.

Test manuel avant CI :

```bash
ssh -i ./avatar_deploy_ed25519 -p 22 deploy@<VPS_HOST>
```

---

## Accès Git sur le VPS (`git fetch`)

Le user `deploy` doit pouvoir tirer le dépôt sans interaction :

- repo **public** : `git fetch` HTTPS suffit ; ou
- **Deploy key** en lecture seule (ed25519 distincte) ajoutée au repo GitHub + configurée dans `~deploy/.ssh`.

---

## Tester le workflow

1. Vérifie que Nginx + PM2 + health manuel marchent :

```bash
curl -sS https://test-avatar.academyskills.net/api/health
```

2. Sur GitHub → onglet **Actions** → workflow **Deploy TEST (test-avatar)**.
3. Soit :
   - **Run workflow** (bouton `workflow_dispatch`), soit
   - un `git push` sur `main`.
4. Le job doit finir en vert. S’il est rouge à cause du healthcheck, le déploiement est considéré **en échec** (exit code ≠ 0).

---

## Ce que fait le pipeline

1. SSH vers le VPS (secrets uniquement).
2. `git fetch` + `git reset --hard origin/main`.
3. Relie `.env` depuis `shared/` (jamais transmis par Actions).
4. `npm install` + `npm run build`.
5. `pm2 reload avatar-candidat` (ou `pm2 start deploy/ecosystem.config.cjs` au premier run).
6. Boucle healthcheck sur `/api/health` — **échec du job** si pas HTTP 200.

---

## Désactiver le CI/CD

- Temporaire : GitHub → Actions → workflow → **Disable workflow**.
- Ou renommer/supprimer `.github/workflows/deploy-test.yml`.
- Ou retirer le secret `VPS_SSH_KEY` (les prochains runs échoueront à la connexion).

---

## Rollback

Sur le VPS, en `deploy` :

```bash
cd /var/www/avatar-candidat/app
git log --oneline -10
git reset --hard <commit_sha_stable>
npm install --no-fund --no-audit
npm run build
pm2 reload avatar-candidat
curl -sS https://test-avatar.academyskills.net/api/health
```

Alternative depuis GitHub : revert du commit fautif sur `main`, puis laisser le workflow redéployer.

---

## Isolation des autres projets du VPS

- Dossier dédié : `/var/www/avatar-candidat/`
- Port dédié : `3010`
- Process PM2 dédié : `avatar-candidat` (PM2 du user `deploy`)
- Vhost Nginx dédié : `test-avatar.academyskills.net`

Ne jamais lancer `pm2 delete all` / `pm2 restart all` en root.
