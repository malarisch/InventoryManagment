# CI/CD Pipeline für InventoryManagment

Dieses Projekt nutzt GitHub Actions für Continuous Integration und Deployment.

## Workflows

### 1. Lint (`run_tests.yml`)

**Trigger:** Push/PR auf `main`

**Schritte:**
- ESLint
- TypeScript Type Check (`tsc --noEmit`)
- Vitest Unit Tests

**Dauer:** ~1-2 Minuten

---

### 2. Integration Tests (`integration-tests.yml`)

**Trigger:** Push/PR auf `main`

**Schritte:**
1. Setup Node.js 24
2. Install Dependencies (`npm ci`)
3. Start Supabase (mit Docker Image Caching)
4. Generate `.env.local` via `scripts/write-supabase-env.sh`
5. Generate Prisma Client
6. Install Playwright Browsers (mit Caching)
7. Build Next.js App
8. Start Next.js Server
9. Run Full Test Suite (lint + tsc + unit + E2E)

**Optimierungen:**
- Docker Image Caching (Supabase)
- Playwright Browser Caching
- Prisma Engine Caching

**Dauer:** ~5-8 Minuten

---

### 3. Docker Build & Push (`docker-build.yml`)

**Trigger:** Nach erfolgreichen Integration Tests auf `main` (oder manuell via `workflow_dispatch`)

**Schritte:**
1. Checkout Code
2. Setup Docker Buildx
3. Login to GitHub Container Registry (`ghcr.io`)
4. Extract Metadata (Tags + Labels)
5. Build Multi-Stage Docker Image
6. Push to `ghcr.io/malarisch/inventorymanagment`

**Tags:**
- `latest` (für main branch)
- `main-<git-sha>` (jeder Commit)
- `<branch-name>` (Branch Builds)
- Semantic Versioning (wenn Git-Tags gepusht werden)

**Optimierungen:**
- GitHub Actions Cache für Docker Layers
- Multi-Stage Build (deps, builder, runner)

**Dauer:** ~3-5 Minuten

**Image Size:** ~150-200 MB (optimiert durch Alpine + standalone output)

---

## Gesamte Pipeline

```
Push to main
    ↓
[Lint] ────────────────┐
    ↓                  ↓
[Integration Tests] ───→ Success?
    ↓                      ↓
    ✓                  [Docker Build]
                           ↓
                       Push to ghcr.io
                           ↓
                       Image verfügbar:
                       ghcr.io/malarisch/inventorymanagment:latest
```

**Total Zeit:** ~10-15 Minuten von Push bis fertiges Image

---

## Image Nutzung

### Pull Latest Image

```bash
docker pull ghcr.io/malarisch/inventorymanagment:latest
```

### Pull Specific SHA

```bash
docker pull ghcr.io/malarisch/inventorymanagment:main-abc1234
```

### Run Container

```bash
docker run -p 3000:3000 \
  --env-file .env.production \
  ghcr.io/malarisch/inventorymanagment:latest
```

---

## Local Testing der Workflows

### Test Docker Build lokal

```bash
# Simuliere GitHub Actions Build
docker build -t test-build .

# Mit Buildx (wie in CI)
docker buildx build --platform linux/amd64 -t test-build .
```

### Test Integration Tests lokal

```bash
# Genau wie CI
npm ci
npx supabase start
./scripts/write-supabase-env.sh > .env.local
npx prisma generate
npm run build
npm run start &
npm run test
```

---

## Monitoring & Debugging

### GitHub Actions Logs

1. Gehe zu https://github.com/malarisch/InventoryManagment/actions
2. Wähle Workflow Run
3. Klicke auf Job (z.B. "Build and Push Docker Image")
4. Siehe Logs für jeden Step

### Docker Image Inspizieren

```bash
# Image Layers anschauen
docker history ghcr.io/malarisch/inventorymanagment:latest

# Image Size
docker images ghcr.io/malarisch/inventorymanagment

# Container Logs
docker logs <container-id>
```

### Häufige Fehler

**"workflow_run.conclusion == 'success'" schlägt fehl:**
- Integration Tests müssen erfolgreich sein
- Check vorherigen Workflow Run

**"permission denied" beim Push:**
- `GITHUB_TOKEN` braucht `packages: write` Permission
- Ist bereits in `docker-build.yml` konfiguriert

**Docker Build schlägt fehl:**
- Prüfe `Dockerfile` Syntax
- Teste lokal: `docker build .`
- Check `.dockerignore` für fehlende Dateien

---

## Erweiterungen

### Automatisches Deployment zu Vercel

Füge zu `.github/workflows/` hinzu:

```yaml
name: Deploy to Vercel
on:
  workflow_run:
    workflows: ["Integration Tests"]
    types: [completed]
jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Semantic Versioning

Git Tags automatisch zu Docker Tags mappen:

```bash
# Tag erstellen
git tag v1.0.0
git push --tags

# Triggert Build mit Tags:
# - ghcr.io/.../inventorymanagment:v1.0.0
# - ghcr.io/.../inventorymanagment:1.0
# - ghcr.io/.../inventorymanagment:1
```

---

## Best Practices

✅ **DO:**
- Branch Protection Rules für `main` aktivieren
- Require Status Checks (Integration Tests) vor Merge
- Squash Commits vor Merge für cleane History
- Semantic Commit Messages (`feat:`, `fix:`, etc.)

❌ **DON'T:**
- Nie Secrets in Code committen
- Keine `workflow_dispatch` Triggers ohne Autorisierung
- Große Files nicht in Docker Image packen (.dockerignore nutzen)

---

## Kontakt & Support

Bei Problemen mit CI/CD:
1. Check GitHub Actions Logs
2. Siehe `AGENTS.md` für Architektur-Details
3. Siehe `DOCKER.md` für Docker-spezifische Probleme
4. Open GitHub Issue mit Workflow-Run-Link
