# Docker Deployment für InventoryManagment

Dieses Dokument beschreibt, wie du die InventoryManagment-App mit Docker deployen kannst.

## Voraussetzungen

- Docker & Docker Compose installiert
- Produktions-Supabase-Projekt (oder selbst gehostete Supabase-Instanz)
- Migrationen auf Produktion angewendet

## Quick Start

### 1. Environment Variables vorbereiten

Erstelle eine `.env.production` Datei:

```bash
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Prisma)
DATABASE_URL=postgresql://postgres:password@your-db-host:5432/postgres

# Optional: S3 Storage
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1
NEXT_PUBLIC_STORAGE_S3_URL=https://your-project.supabase.co/storage/v1/s3
```

### 2. Image bauen und starten

```bash
# Mit docker-compose (empfohlen)
docker-compose --env-file .env.production up -d

# Oder nur das Image bauen
docker build -t inventory-management:latest .

# Und manuell starten
docker run -p 3000:3000 \
  --env-file .env.production \
  inventory-management:latest
```

### 3. App aufrufen

Öffne http://localhost:3000 im Browser.

## Deployment-Optionen

### Option A: Mit Docker Compose (empfohlen)

Nutzt `docker-compose.yml` für orchestrierte Deployment mit optionaler lokaler PostgreSQL-DB.

```bash
# Starten
docker-compose --env-file .env.production up -d

# Logs anzeigen
docker-compose logs -f app

# Stoppen
docker-compose down
```

### Option B: Standalone Docker

```bash
# Image bauen
docker build -t inventory-management:latest .

# Container starten
docker run -d \
  --name inventory-app \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-key" \
  -e DATABASE_URL="postgresql://..." \
  inventory-management:latest

# Logs anzeigen
docker logs -f inventory-app
```

### Option C: Push zu Container Registry

```bash
# Docker Hub
docker tag inventory-management:latest your-username/inventory-management:latest
docker push your-username/inventory-management:latest

# GitHub Container Registry
docker tag inventory-management:latest ghcr.io/your-username/inventory-management:latest
docker push ghcr.io/your-username/inventory-management:latest
```

## Produktion mit Supabase Cloud

### 1. Supabase-Projekt erstellen

1. Gehe zu https://supabase.com
2. Erstelle neues Projekt
3. Notiere dir: URL, Anon Key, Service Role Key

### 2. Migrationen anwenden

```bash
# Projekt verknüpfen
npx supabase link --project-ref your-project-ref

# Migrationen pushen
npx supabase db push
```

### 3. Storage Buckets erstellen

Im Supabase Dashboard unter Storage:
- `company_files` (public)
- `private_files` (private)

### 4. Erste Company anlegen

SQL Editor im Supabase Dashboard:

```sql
-- Erstelle ersten Admin-User (über Supabase Auth UI)
-- Dann:
INSERT INTO public.companies (name, owner_user_id) 
VALUES ('Deine Firma', 'user-id-vom-auth-user');

INSERT INTO public.users_companies (user_id, company_id)
VALUES ('user-id-vom-auth-user', 'company-id-von-oben');
```

## Troubleshooting

### Image Build schlägt fehl

```bash
# Cache löschen und neu bauen
docker build --no-cache -t inventory-management:latest .
```

### Prisma Client Fehler

Stelle sicher, dass `DATABASE_URL` korrekt gesetzt ist:

```bash
# Teste DB-Verbindung
docker run --rm \
  -e DATABASE_URL="your-connection-string" \
  inventory-management:latest \
  sh -c "npx prisma db pull"
```

### Port bereits belegt

```bash
# Anderen Port nutzen
docker run -p 8080:3000 ... inventory-management:latest
```

### Next.js standalone output Fehler

Prüfe, ob `next.config.ts` `output: 'standalone'` enthält (sollte automatisch der Fall sein).

## Production Best Practices

1. **Secrets Management**: Nutze Docker Secrets oder externe Secret Manager
2. **Health Checks**: Füge Health-Check-Endpoint hinzu (`/api/health`)
3. **Logging**: Zentralisiere Logs mit Loki/ELK Stack
4. **Monitoring**: Nutze Prometheus + Grafana
5. **Reverse Proxy**: Setze Nginx/Caddy vor Next.js für SSL/Caching
6. **Auto-Scaling**: Deploy mit Kubernetes/Docker Swarm für Skalierung

## Beispiel Production Stack

```yaml
# nginx-proxy mit SSL
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

  app:
    image: inventory-management:latest
    environment:
      - NODE_ENV=production
      # ... weitere env vars
    restart: always
```

## Support

Bei Problemen siehe:
- `AGENTS.md` für Architektur-Details
- `supabase_ai_docs/` für Supabase-spezifische Infos
- GitHub Issues für bekannte Probleme
