# Project Structure

```
planning-checklist/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── server/
│   ├── api/                    # API routes
│   │   ├── auth/
│   │   ├── users/
│   │   ├── inspectors/
│   │   ├── turnover/
│   │   ├── targets/
│   │   ├── checklist/
│   │   ├── absences/
│   │   ├── dashboard/
│   │   └── reports/
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── admin.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── ...
│   └── utils/
│       ├── prisma.ts
│       ├── errors.ts
│       └── validators.ts
├── app/
│   ├── components/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── turnover/
│   │   ├── checklist/
│   │   └── ...
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useTurnover.ts
│   │   └── ...
│   ├── stores/
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   ├── pages/
│   │   ├── index.vue
│   │   ├── login.vue
│   │   ├── planner/
│   │   └── admin/
│   ├── layouts/
│   │   ├── default.vue
│   │   └── auth.vue
│   └── middleware/
│       ├── auth.global.ts
│       └── admin.ts
├── i18n/
│   └── locales/
│       ├── nl.json
│       └── fr.json
├── types/
│   ├── index.ts
│   └── api.ts
├── tests/
├── public/
├── .env.example
├── nuxt.config.ts
├── tailwind.config.ts
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Directory Conventions

- **server/api/**: Nuxt server routes (REST endpoints)
- **server/services/**: Business logic layer
- **server/middleware/**: Request middleware (auth, etc.)
- **app/components/**: Vue components organized by feature
- **app/composables/**: Reusable Vue composition functions
- **app/stores/**: Pinia state stores
- **app/pages/**: File-based routing
- **i18n/locales/**: Translation JSON files
- **types/**: Shared TypeScript types
