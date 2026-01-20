# Story 1.1: Project Setup and Infrastructure

**Epic:** Epic 1 - Foundation & Authentication
**Status:** Approved
**Priority:** Critical (Foundation)
**Estimate:** 2-3 hours

---

## User Story

**As a** developer,
**I want** a properly configured Nuxt.js 3 project with all required dependencies,
**so that** I have a solid foundation to build the application features.

---

## Acceptance Criteria

- [ ] 1. Nuxt.js 3 project initialized with TypeScript configuration
- [ ] 2. Tailwind CSS and Nuxt UI configured for styling
- [ ] 3. PostgreSQL database connection configured via environment variables
- [ ] 4. Prisma ORM installed and configured with initial User model
- [ ] 5. Docker configuration (Dockerfile, docker-compose.yml) for local development
- [ ] 6. ESLint configured for code quality
- [ ] 7. @nuxtjs/i18n configured with Dutch (default) and French language files
- [ ] 8. Basic health check API endpoint (`/api/health`) returns 200 OK
- [ ] 9. Application starts successfully with `npm run dev`

---

## Technical Requirements

### 1. Initialize Nuxt.js Project

```bash
npx nuxi@latest init planning-checklist
cd planning-checklist
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install @nuxt/ui @nuxtjs/i18n pinia @pinia/nuxt

# Database
npm install @prisma/client
npm install -D prisma

# Validation
npm install zod

# Dev dependencies
npm install -D @nuxt/eslint eslint
```

### 3. Configure nuxt.config.ts

```typescript
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@nuxt/eslint',
  ],

  i18n: {
    locales: [
      { code: 'nl', name: 'Nederlands', file: 'nl.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
    ],
    defaultLocale: 'nl',
    lazy: true,
    langDir: 'i18n/locales',
  },

  runtimeConfig: {
    // Server-side only
    databaseUrl: process.env.DATABASE_URL,
    entraClientId: process.env.NUXT_ENTRA_CLIENT_ID,
    entraClientSecret: process.env.NUXT_ENTRA_CLIENT_SECRET,
    entraTenantId: process.env.NUXT_ENTRA_TENANT_ID,
    sessionSecret: process.env.NUXT_SESSION_SECRET,
    // Public (exposed to client)
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },

  compatibilityDate: '2024-11-01',
});
```

### 4. Initialize Prisma

```bash
npx prisma init
```

Create initial schema with User model only (for Story 1.1):

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  PLANNER
}

enum Locale {
  nl
  fr
}

model User {
  id        String   @id @default(uuid())
  entraId   String   @unique
  email     String   @unique
  name      String
  role      Role     @default(PLANNER)
  locale    Locale   @default(nl)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### 5. Create Prisma Client Utility

```typescript
// server/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

### 6. Create i18n Files

```json
// i18n/locales/nl.json
{
  "app": {
    "name": "Planning Checklist",
    "loading": "Laden...",
    "error": "Er is een fout opgetreden"
  },
  "nav": {
    "dashboard": "Dashboard",
    "turnover": "Omzet",
    "checklist": "Checklist",
    "inspectors": "Inspecteurs",
    "planners": "Planners",
    "reports": "Rapporten",
    "settings": "Instellingen"
  },
  "auth": {
    "login": "Inloggen",
    "logout": "Uitloggen",
    "loginWithMicrosoft": "Inloggen met Microsoft"
  },
  "common": {
    "save": "Opslaan",
    "cancel": "Annuleren",
    "delete": "Verwijderen",
    "edit": "Bewerken",
    "add": "Toevoegen",
    "search": "Zoeken",
    "filter": "Filteren",
    "export": "Exporteren",
    "yes": "Ja",
    "no": "Nee"
  }
}
```

```json
// i18n/locales/fr.json
{
  "app": {
    "name": "Planning Checklist",
    "loading": "Chargement...",
    "error": "Une erreur s'est produite"
  },
  "nav": {
    "dashboard": "Tableau de bord",
    "turnover": "Chiffre d'affaires",
    "checklist": "Liste de contrôle",
    "inspectors": "Inspecteurs",
    "planners": "Planificateurs",
    "reports": "Rapports",
    "settings": "Paramètres"
  },
  "auth": {
    "login": "Connexion",
    "logout": "Déconnexion",
    "loginWithMicrosoft": "Se connecter avec Microsoft"
  },
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "add": "Ajouter",
    "search": "Rechercher",
    "filter": "Filtrer",
    "export": "Exporter",
    "yes": "Oui",
    "no": "Non"
  }
}
```

### 7. Create Health Check Endpoint

```typescript
// server/api/health.get.ts
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
});
```

### 8. Create Environment Template

```bash
# .env.example

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/planning_checklist"

# Microsoft Entra ID (configure in later story)
NUXT_ENTRA_CLIENT_ID=""
NUXT_ENTRA_CLIENT_SECRET=""
NUXT_ENTRA_TENANT_ID="common"

# Session
NUXT_SESSION_SECRET="change-this-to-random-32-char-string"

# App
NUXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 9. Create Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/planning_checklist
      - NUXT_SESSION_SECRET=dev-secret-change-in-production
      - NUXT_PUBLIC_APP_URL=http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
    
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: planning_checklist
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 10. Create Basic Landing Page

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
        {{ t('app.name') }}
      </h1>
      <p class="mt-4 text-gray-600 dark:text-gray-400">
        {{ t('app.loading') }}
      </p>
    </div>
  </div>
</template>
```

---

## Tasks Checklist

- [ ] Initialize Nuxt.js 3 project
- [ ] Install and configure @nuxt/ui
- [ ] Install and configure @nuxtjs/i18n with nl/fr locales
- [ ] Install and configure Pinia
- [ ] Install and configure Prisma with PostgreSQL
- [ ] Create initial User model in Prisma schema
- [ ] Create prisma.ts utility
- [ ] Create .env.example file
- [ ] Create health check API endpoint
- [ ] Create basic index.vue page with i18n
- [ ] Create Dockerfile
- [ ] Create docker-compose.yml
- [ ] Configure ESLint
- [ ] Test `npm run dev` works
- [ ] Test `docker-compose up` works
- [ ] Run Prisma migration

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code follows project conventions
- [ ] No ESLint errors
- [ ] Application starts without errors
- [ ] Health check endpoint accessible at /api/health
- [ ] i18n working with language switch
- [ ] Docker build completes successfully

---

## File List

Files to be created/modified:

```
planning-checklist/
├── .env.example
├── nuxt.config.ts
├── package.json
├── Dockerfile
├── docker-compose.yml
├── eslint.config.mjs
├── prisma/
│   └── schema.prisma
├── server/
│   ├── api/
│   │   └── health.get.ts
│   └── utils/
│       └── prisma.ts
├── app/
│   └── pages/
│       └── index.vue
└── i18n/
    └── locales/
        ├── nl.json
        └── fr.json
```

---

## Notes

- This is the foundation story - all other stories depend on this
- Keep the scope minimal - only what's needed for the foundation
- Authentication will be added in Story 1.2
- More database models will be added in Epic 2
