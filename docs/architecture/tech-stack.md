# Tech Stack Reference

## Core Technologies

| Category | Technology | Version |
|----------|------------|---------|
| Frontend Framework | Nuxt.js | 3.14+ |
| UI Components | Nuxt UI | 2.x |
| CSS | Tailwind CSS | 3.x |
| State Management | Pinia | 2.x |
| i18n | @nuxtjs/i18n | 8.x |
| Database | PostgreSQL | 16.x |
| ORM | Prisma | 5.x |
| Auth | MSAL.js / MSAL Node | 3.x / 2.x |
| Testing | Vitest + Playwright | 1.x |

## Key NPM Packages

```json
{
  "dependencies": {
    "@nuxt/ui": "^2.x",
    "@nuxtjs/i18n": "^8.x",
    "@prisma/client": "^5.x",
    "@azure/msal-browser": "^3.x",
    "@azure/msal-node": "^2.x",
    "pinia": "^2.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "vitest": "^1.x",
    "@playwright/test": "^1.x",
    "typescript": "^5.x"
  }
}
```

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/planning_checklist"

# Microsoft Entra ID
NUXT_ENTRA_CLIENT_ID="your-client-id"
NUXT_ENTRA_CLIENT_SECRET="your-client-secret"
NUXT_ENTRA_TENANT_ID="common"

# Session
NUXT_SESSION_SECRET="random-32-char-string"

# App
NUXT_PUBLIC_APP_URL="http://localhost:3000"
```
