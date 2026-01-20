# Planning Checklist

A modern web application for managing daily planning tasks, inspector turnover tracking, and team coordination. Built with Nuxt.js 3, PostgreSQL, and Microsoft Entra ID authentication.

![Planning Checklist](https://img.shields.io/badge/Nuxt-3.x-00DC82?style=flat&logo=nuxt.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat&logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)

## Features

### For Planners
- 📊 **Turnover Entry** - Weekly grid to enter inspector turnover amounts
- ✅ **Daily Checklist** - Track completion of daily tasks
- 📈 **Weekly Summary** - View performance metrics and calculations
- 🌍 **Bilingual** - Dutch and French language support

### For Admins
- 👥 **User Management** - Manage planners and their roles
- 🔍 **Inspector Management** - CRUD operations and planner assignment
- 🎯 **Target Management** - Set daily turnover targets
- 📋 **Task Management** - Configure checklist tasks
- 🏖️ **Absence Management** - Handle planner absences with inspector reassignment
- 📊 **Reports** - Weekly performance reports with Excel export
- 🔄 **Real-time Dashboard** - Live updates via Server-Sent Events

## Tech Stack

- **Framework**: [Nuxt.js 3](https://nuxt.com/) with Vue 3
- **UI**: [Nuxt UI](https://ui.nuxt.com/) + Tailwind CSS
- **Database**: PostgreSQL 16 with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: Microsoft Entra ID (Azure AD) via MSAL
- **Internationalization**: @nuxtjs/i18n (Dutch/French)
- **Real-time**: Server-Sent Events (SSE)
- **Deployment**: Docker / Easypanel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- PostgreSQL 16+
- Microsoft Entra ID application

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/checklistplanning.git
cd checklistplanning

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed initial data (optional)
pnpm tsx scripts/seed.ts

# Start development server
pnpm dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NUXT_SESSION_SECRET` | Session encryption key (32+ chars) | ✅ |
| `NUXT_PUBLIC_APP_URL` | Application URL | ✅ |
| `NUXT_ENTRA_CLIENT_ID` | Azure App Client ID | ✅ |
| `NUXT_ENTRA_CLIENT_SECRET` | Azure App Client Secret | ✅ |
| `NUXT_ENTRA_TENANT_ID` | Azure Tenant ID (or 'common') | ✅ |

## Development

```bash
# Start dev server
pnpm dev

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Format code
pnpm lint --fix
```

### Database Management

```bash
# Create migration
pnpm prisma migrate dev --name your_migration_name

# Apply migrations
pnpm prisma migrate deploy

# Open Prisma Studio
pnpm prisma studio

# Reset database (dev only)
pnpm prisma migrate reset
```

## Deployment

### Docker

```bash
# Build image
docker build -t planning-checklist .

# Run with Docker Compose
docker compose up -d
```

### Easypanel

See [Deployment Guide](docs/deployment.md) for detailed instructions.

## Project Structure

```
checklistplanning/
├── app/
│   ├── components/      # Vue components
│   ├── composables/     # Vue composables
│   ├── layouts/         # Page layouts
│   ├── middleware/      # Route middleware
│   ├── pages/           # File-based routing
│   └── server/
│       ├── api/         # API endpoints
│       ├── routes/      # Server routes
│       ├── types/       # TypeScript types
│       └── utils/       # Server utilities
├── docs/                # Documentation
├── i18n/
│   └── locales/         # Translation files
├── prisma/
│   └── schema.prisma    # Database schema
├── public/              # Static assets
├── scripts/             # Utility scripts
└── types/               # Shared TypeScript types
```

## API Endpoints

### Authentication
- `GET /auth/microsoft` - Initiate login
- `GET /auth/microsoft/callback` - OAuth callback
- `POST /auth/logout` - Logout

### Turnover
- `GET /api/turnover/entries` - Get entries for date range
- `POST /api/turnover/entries` - Create/update entry
- `GET /api/turnover/summary` - Get weekly summary
- `POST /api/turnover/targets` - Set inspector target

### Checklist
- `GET /api/checklist/tasks` - List all tasks
- `POST /api/checklist/tasks` - Create task (admin)
- `PATCH /api/checklist/tasks/:id` - Update task (admin)
- `GET /api/checklist/entries` - Get entries for date
- `POST /api/checklist/entries` - Toggle task completion

### Admin
- `GET /api/users` - List users
- `PATCH /api/users/:id` - Update user role
- `GET /api/inspectors` - List inspectors
- `POST /api/inspectors` - Create inspector
- `PATCH /api/inspectors/:id` - Update inspector
- `POST /api/inspectors/assign` - Bulk assign to planner
- `GET /api/absences` - List absences
- `POST /api/absences` - Create absence
- `POST /api/absences/reassign` - Reassign inspector

### Reports
- `GET /api/reports/weekly` - Weekly report data
- `GET /api/reports/export` - Download Excel

### Real-time
- `GET /api/events/stream` - SSE event stream

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and feature requests, please [open an issue](https://github.com/your-org/checklistplanning/issues).
