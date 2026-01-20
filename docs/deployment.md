# Deployment Guide

This guide covers deploying the Planning Checklist application to Easypanel or any Docker-compatible environment.

## Prerequisites

- Docker & Docker Compose
- PostgreSQL 16+ database
- Microsoft Entra ID (Azure AD) application
- Domain with SSL certificate

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/planning_checklist"

# Application
NUXT_PUBLIC_APP_URL="https://planning.yourdomain.com"
NUXT_SESSION_SECRET="your-32-character-minimum-secret"

# Microsoft Entra ID
NUXT_ENTRA_CLIENT_ID="your-client-id"
NUXT_ENTRA_CLIENT_SECRET="your-client-secret"
NUXT_ENTRA_TENANT_ID="common"
```

### Generating Session Secret

```bash
openssl rand -base64 32
```

## Microsoft Entra ID Setup

### 1. Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - Name: `Planning Checklist`
   - Supported account types: **Accounts in any organizational directory (Multi-tenant)**
   - Redirect URI: `https://planning.yourdomain.com/auth/microsoft/callback`

### 2. Configure Authentication

1. Go to **Authentication**
2. Add platform: **Web**
3. Redirect URIs:
   - `https://planning.yourdomain.com/auth/microsoft/callback`
   - `http://localhost:3000/auth/microsoft/callback` (for development)
4. Enable **ID tokens** under Implicit grant

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Copy the secret value (you won't see it again!)

### 4. API Permissions

Ensure these permissions are granted:
- `User.Read` (Delegated)
- `openid` (Delegated)
- `profile` (Delegated)
- `offline_access` (Delegated)

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE planning_checklist;
```

### 2. Run Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy
```

### 3. Seed Initial Data (Optional)

```bash
npx tsx scripts/seed.ts
```

### 4. Create First Admin

After first login, promote your user to admin:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

## Easypanel Deployment

### Option 1: Using Docker Hub/GHCR

1. Build and push your image:

```bash
# Build
docker build -t your-registry/planning-checklist:latest .

# Push
docker push your-registry/planning-checklist:latest
```

2. In Easypanel:
   - Create new **App** → **Docker Image**
   - Image: `your-registry/planning-checklist:latest`
   - Port: `3000`
   - Add environment variables
   - Enable HTTPS

### Option 2: Using Git Repository

1. In Easypanel:
   - Create new **App** → **Git Repository**
   - Connect your repository
   - Dockerfile path: `Dockerfile`
   - Add environment variables
   - Enable HTTPS

### Environment Variables in Easypanel

Add these in the **Environment** tab:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NUXT_SESSION_SECRET` | 32+ char secret |
| `NUXT_PUBLIC_APP_URL` | Your app URL with https |
| `NUXT_ENTRA_CLIENT_ID` | Azure App Client ID |
| `NUXT_ENTRA_CLIENT_SECRET` | Azure App Client Secret |
| `NUXT_ENTRA_TENANT_ID` | `common` for multi-tenant |

### Database in Easypanel

1. Create new **Database** → **PostgreSQL**
2. Note the connection string
3. Use it as `DATABASE_URL`

## Docker Compose Deployment

For non-Easypanel Docker deployments:

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start with Docker Compose
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose exec planning-checklist npx prisma migrate deploy
```

## Health Checks

The application exposes a health endpoint:

```bash
curl https://planning.yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

## Troubleshooting

### Login Redirects to Wrong URL

Check `NUXT_PUBLIC_APP_URL` matches your domain exactly (including `https://`).

### Database Connection Failed

1. Verify `DATABASE_URL` format
2. Check network connectivity
3. Ensure database exists

### MSAL Errors

1. Verify Entra ID credentials
2. Check redirect URI matches exactly
3. Ensure API permissions are granted

### Container Won't Start

Check logs:
```bash
docker logs planning-checklist
```

## Updating

```bash
# Pull latest image
docker pull your-registry/planning-checklist:latest

# Restart container
docker compose -f docker-compose.prod.yml up -d

# Run any new migrations
docker compose exec planning-checklist npx prisma migrate deploy
```

## Backup

### Database Backup

```bash
pg_dump -U postgres planning_checklist > backup.sql
```

### Restore

```bash
psql -U postgres planning_checklist < backup.sql
```
