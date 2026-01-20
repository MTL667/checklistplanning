# Planning Checklist Application - Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for the Planning Checklist Application, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

### Starter Template or Existing Project

**N/A - Greenfield project**

This is a new project built from scratch using Nuxt.js 3. We will use the official Nuxt starter with additional modules configured during setup.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-20 | 0.1 | Initial architecture document | Architect Agent |

---

## High Level Architecture

### Technical Summary

The Planning Checklist Application is a fullstack monolith built with Nuxt.js 3, leveraging its server-side capabilities for API endpoints and PostgreSQL for data persistence. The application uses Microsoft Entra ID for authentication in a multi-tenant configuration. Real-time dashboard updates are achieved through Server-Sent Events (SSE). The entire application is containerized with Docker and deployed to a self-hosted server via Easypanel. This architecture prioritizes simplicity and maintainability for a small user base (~5-10 concurrent users) while supporting future growth.

### Platform and Infrastructure Choice

**Platform:** Self-hosted Docker via Easypanel

**Key Services:**
- Nuxt.js 3 (Frontend + Backend API)
- PostgreSQL (Database)
- Microsoft Entra ID (Authentication)
- Docker (Containerization)
- Easypanel (Deployment & Management)

**Deployment Host and Regions:** Single region deployment on customer's self-hosted infrastructure managed through Easypanel.

**Rationale:** Easypanel provides a simple, cost-effective way to deploy Docker containers with built-in PostgreSQL support, SSL certificates, and easy environment management. This aligns with the customer's existing infrastructure preferences.

### Repository Structure

**Structure:** Monorepo (single repository)

**Monorepo Tool:** npm workspaces (built into npm, no additional tooling needed for this project size)

**Package Organization:** Single Nuxt.js application with clear directory structure. Shared types and utilities co-located within the project.

**Rationale:** For a project of this scope with a single Nuxt.js application, a simple monorepo without complex tooling like Nx or Turborepo is sufficient and reduces complexity.

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end

    subgraph "Authentication"
        Entra[Microsoft Entra ID]
    end

    subgraph "Easypanel Host"
        subgraph "Docker Container"
            Nuxt[Nuxt.js 3 Application]
            subgraph "Nuxt Server"
                Pages[Pages/Views]
                API[Server API Routes]
                SSE[SSE Endpoint]
            end
        end
        
        subgraph "Database Container"
            PG[(PostgreSQL)]
        end
    end

    Browser -->|HTTPS| Nuxt
    Browser -->|OAuth 2.0| Entra
    Entra -->|Token Validation| API
    Pages -->|Fetch| API
    Pages -->|EventSource| SSE
    API -->|Prisma ORM| PG
    SSE -->|Prisma ORM| PG
```

### Architectural Patterns

- **Server-Side Rendering (SSR):** Nuxt.js default rendering mode for SEO and initial load performance - _Rationale:_ Better perceived performance and simpler auth flow with server-side session handling

- **API Routes Pattern:** Nuxt server routes (`/server/api/`) for backend endpoints - _Rationale:_ Single deployment, shared TypeScript types, simpler infrastructure

- **Repository Pattern:** Abstract database access through Prisma ORM with service layer - _Rationale:_ Clean separation of concerns, easier testing, database-agnostic code

- **Event-Driven Updates:** Server-Sent Events for real-time dashboard - _Rationale:_ Simpler than WebSockets for one-way server-to-client updates, native browser support

- **Role-Based Access Control (RBAC):** Middleware-enforced role checks - _Rationale:_ Clear separation of Admin and Planner capabilities

---

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.x | Type-safe development | Industry standard, excellent DX |
| Frontend Framework | Nuxt.js | 3.14+ | Fullstack Vue framework | SSR, file-based routing, server routes |
| UI Component Library | Nuxt UI | 2.x | Pre-built components | Tailwind-based, accessible, Vue 3 native |
| State Management | Pinia | 2.x | Vue state management | Official Vue recommendation, TypeScript support |
| Backend Language | TypeScript | 5.x | Type-safe API development | Shared types with frontend |
| Backend Framework | Nuxt Server (Nitro) | 3.x | API endpoints | Built into Nuxt, H3 server |
| API Style | REST | - | HTTP API endpoints | Simple, well-understood, sufficient for scope |
| Database | PostgreSQL | 16.x | Relational data storage | ACID compliance, excellent for relational data |
| ORM | Prisma | 5.x | Database access | Type-safe queries, migrations, excellent DX |
| Cache | None (initial) | - | - | Add Redis later if needed |
| File Storage | None (initial) | - | - | No file upload requirements |
| Authentication | MSAL.js + MSAL Node | 3.x / 2.x | Microsoft Entra auth | Official Microsoft libraries |
| i18n | @nuxtjs/i18n | 8.x | Internationalization | Dutch/French language support |
| Frontend Testing | Vitest | 1.x | Unit tests | Fast, Vite-native, Jest-compatible |
| Backend Testing | Vitest | 1.x | API tests | Unified testing framework |
| E2E Testing | Playwright | 1.x | End-to-end tests | Cross-browser, reliable |
| Build Tool | Nuxt CLI | 3.x | Build & dev server | Integrated with Nuxt |
| Bundler | Vite | 5.x | Module bundling | Fast, ESM-native (Nuxt default) |
| CSS Framework | Tailwind CSS | 3.x | Utility-first CSS | Included with Nuxt UI |
| CI/CD | GitHub Actions | - | Automated deployment | Simple, integrated with Git |
| Monitoring | Console logging | - | Basic observability | Add Sentry later for production |
| Logging | Consola | - | Structured logging | Built into Nuxt/Nitro |

---

## Data Models

### User

**Purpose:** Represents authenticated users (Planners and Administrators) from Microsoft Entra

**Key Attributes:**
- `id`: UUID - Primary key (auto-generated)
- `entraId`: String - Microsoft Entra object ID (unique)
- `email`: String - User email address
- `name`: String - Display name
- `role`: Enum - ADMIN or PLANNER
- `locale`: String - Preferred language (nl/fr)
- `createdAt`: DateTime - Account creation timestamp
- `updatedAt`: DateTime - Last update timestamp

**TypeScript Interface:**

```typescript
interface User {
  id: string;
  entraId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PLANNER';
  locale: 'nl' | 'fr';
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- One User (Planner) has many Inspectors assigned
- One User has many ChecklistEntries
- One User has many AbsenceRecords

---

### Inspector

**Purpose:** Represents inspectors whose turnover is tracked by planners

**Key Attributes:**
- `id`: UUID - Primary key
- `name`: String - Inspector's name
- `plannerId`: UUID - Assigned planner (nullable for unassigned)
- `isActive`: Boolean - Active status
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last update timestamp

**TypeScript Interface:**

```typescript
interface Inspector {
  id: string;
  name: string;
  plannerId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Many Inspectors belong to one Planner (User)
- One Inspector has many TurnoverEntries
- One Inspector has many TurnoverTargets
- One Inspector has many AssignmentHistory records

---

### TurnoverEntry

**Purpose:** Daily turnover amount recorded for an inspector

**Key Attributes:**
- `id`: UUID - Primary key
- `inspectorId`: UUID - Reference to inspector
- `plannerId`: UUID - Planner who entered the data
- `date`: Date - Entry date
- `amount`: Decimal - Turnover amount
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last update timestamp

**TypeScript Interface:**

```typescript
interface TurnoverEntry {
  id: string;
  inspectorId: string;
  plannerId: string;
  date: Date;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Many TurnoverEntries belong to one Inspector
- Many TurnoverEntries belong to one Planner (User)

---

### TurnoverTarget

**Purpose:** Daily target amount for an inspector set by admin

**Key Attributes:**
- `id`: UUID - Primary key
- `inspectorId`: UUID - Reference to inspector
- `date`: Date - Target date (nullable for default)
- `amount`: Decimal - Target amount
- `isDefault`: Boolean - Whether this is the default target
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last update timestamp

**TypeScript Interface:**

```typescript
interface TurnoverTarget {
  id: string;
  inspectorId: string;
  date: Date | null;
  amount: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Many TurnoverTargets belong to one Inspector

---

### TaskType

**Purpose:** Configurable checklist task types created by admin

**Key Attributes:**
- `id`: UUID - Primary key
- `name`: String - Task name
- `nameNl`: String - Dutch name
- `nameFr`: String - French name
- `description`: String - Task description
- `descriptionNl`: String - Dutch description
- `descriptionFr`: String - French description
- `frequency`: Enum - DAILY, WEEKLY
- `sortOrder`: Integer - Display order
- `isActive`: Boolean - Active status
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last update timestamp

**TypeScript Interface:**

```typescript
interface TaskType {
  id: string;
  name: string;
  nameNl: string;
  nameFr: string;
  description: string;
  descriptionNl: string;
  descriptionFr: string;
  frequency: 'DAILY' | 'WEEKLY';
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- One TaskType has many ChecklistEntries

---

### ChecklistEntry

**Purpose:** Record of task completion by a planner

**Key Attributes:**
- `id`: UUID - Primary key
- `taskTypeId`: UUID - Reference to task type
- `plannerId`: UUID - Reference to planner
- `date`: Date - Completion date
- `completedAt`: DateTime - When marked complete (nullable)
- `createdAt`: DateTime - Creation timestamp

**TypeScript Interface:**

```typescript
interface ChecklistEntry {
  id: string;
  taskTypeId: string;
  plannerId: string;
  date: Date;
  completedAt: Date | null;
  createdAt: Date;
}
```

**Relationships:**
- Many ChecklistEntries belong to one TaskType
- Many ChecklistEntries belong to one Planner (User)

---

### AbsenceRecord

**Purpose:** Track planner absences and related inspector redistributions

**Key Attributes:**
- `id`: UUID - Primary key
- `plannerId`: UUID - Absent planner
- `reason`: Enum - SICK, LEAVE
- `startDate`: Date - Absence start
- `endDate`: Date - Absence end (nullable if ongoing)
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last update timestamp

**TypeScript Interface:**

```typescript
interface AbsenceRecord {
  id: string;
  plannerId: string;
  reason: 'SICK' | 'LEAVE';
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Many AbsenceRecords belong to one Planner (User)
- One AbsenceRecord has many InspectorReassignments

---

### InspectorReassignment

**Purpose:** Track temporary inspector reassignments during absences

**Key Attributes:**
- `id`: UUID - Primary key
- `inspectorId`: UUID - Reassigned inspector
- `absenceRecordId`: UUID - Related absence
- `fromPlannerId`: UUID - Original planner
- `toPlannerId`: UUID - Temporary planner
- `createdAt`: DateTime - Reassignment timestamp
- `restoredAt`: DateTime - When restored (nullable)

**TypeScript Interface:**

```typescript
interface InspectorReassignment {
  id: string;
  inspectorId: string;
  absenceRecordId: string;
  fromPlannerId: string;
  toPlannerId: string;
  createdAt: Date;
  restoredAt: Date | null;
}
```

**Relationships:**
- Many InspectorReassignments belong to one AbsenceRecord
- Many InspectorReassignments reference Inspectors and Users

---

## API Specification

### REST API Specification

Base URL: `/api`

#### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/auth/session` | Get current session | Public |
| POST | `/api/auth/callback` | Handle Entra callback | Public |
| POST | `/api/auth/logout` | Logout user | Auth |

#### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PATCH | `/api/users/:id` | Update user (role, locale) | Admin |
| GET | `/api/users/me` | Get current user | Auth |
| PATCH | `/api/users/me` | Update current user preferences | Auth |

#### Inspector Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/inspectors` | List all inspectors | Auth |
| POST | `/api/inspectors` | Create inspector | Admin |
| GET | `/api/inspectors/:id` | Get inspector by ID | Auth |
| PATCH | `/api/inspectors/:id` | Update inspector | Admin |
| DELETE | `/api/inspectors/:id` | Delete inspector | Admin |
| POST | `/api/inspectors/bulk-assign` | Bulk assign to planner | Admin |
| GET | `/api/inspectors/:id/history` | Get assignment history | Admin |

#### Turnover Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/turnover` | Get turnover entries (query params for filters) | Auth |
| POST | `/api/turnover` | Create/update turnover entry | Planner |
| GET | `/api/turnover/summary` | Get calculated summaries | Auth |
| GET | `/api/turnover/export` | Export to CSV/Excel | Admin |

#### Target Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/targets` | List all targets | Admin |
| POST | `/api/targets` | Set target for inspector | Admin |
| PATCH | `/api/targets/:id` | Update target | Admin |
| DELETE | `/api/targets/:id` | Delete target | Admin |
| POST | `/api/targets/bulk` | Bulk update targets | Admin |

#### Checklist Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/checklist/tasks` | Get task types | Auth |
| POST | `/api/checklist/tasks` | Create task type | Admin |
| PATCH | `/api/checklist/tasks/:id` | Update task type | Admin |
| DELETE | `/api/checklist/tasks/:id` | Deactivate task type | Admin |
| GET | `/api/checklist/entries` | Get entries for date | Planner |
| POST | `/api/checklist/entries/:id/complete` | Mark task complete | Planner |
| POST | `/api/checklist/entries/:id/uncomplete` | Unmark task | Planner |

#### Absence Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/absences` | List absences | Admin |
| POST | `/api/absences` | Mark planner absent | Admin |
| PATCH | `/api/absences/:id` | Update absence (end date) | Admin |
| POST | `/api/absences/:id/redistribute` | Redistribute inspectors | Admin |
| POST | `/api/absences/:id/restore` | Restore inspectors | Admin |

#### Dashboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/planner` | Planner dashboard data | Planner |
| GET | `/api/dashboard/admin` | Admin dashboard data | Admin |
| GET | `/api/dashboard/events` | SSE endpoint for real-time | Auth |

#### Reports Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports/turnover` | Turnover history report | Admin |
| GET | `/api/reports/targets` | Target achievement report | Admin |
| GET | `/api/reports/checklist` | Checklist completion report | Admin |

---

## Database Schema

### Prisma Schema

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

enum AbsenceReason {
  SICK
  LEAVE
}

enum TaskFrequency {
  DAILY
  WEEKLY
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

  // Relations
  inspectors           Inspector[]
  turnoverEntries      TurnoverEntry[]
  checklistEntries     ChecklistEntry[]
  absenceRecords       AbsenceRecord[]
  reassignmentsFrom    InspectorReassignment[] @relation("FromPlanner")
  reassignmentsTo      InspectorReassignment[] @relation("ToPlanner")

  @@map("users")
}

model Inspector {
  id        String   @id @default(uuid())
  name      String
  plannerId String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  planner         User?                   @relation(fields: [plannerId], references: [id])
  turnoverEntries TurnoverEntry[]
  targets         TurnoverTarget[]
  reassignments   InspectorReassignment[]

  @@map("inspectors")
}

model TurnoverEntry {
  id          String   @id @default(uuid())
  inspectorId String
  plannerId   String
  date        DateTime @db.Date
  amount      Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  inspector Inspector @relation(fields: [inspectorId], references: [id])
  planner   User      @relation(fields: [plannerId], references: [id])

  @@unique([inspectorId, date])
  @@index([plannerId, date])
  @@map("turnover_entries")
}

model TurnoverTarget {
  id          String    @id @default(uuid())
  inspectorId String
  date        DateTime? @db.Date
  amount      Decimal   @db.Decimal(10, 2)
  isDefault   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  inspector Inspector @relation(fields: [inspectorId], references: [id])

  @@unique([inspectorId, date])
  @@map("turnover_targets")
}

model TaskType {
  id            String        @id @default(uuid())
  name          String
  nameNl        String
  nameFr        String
  description   String?
  descriptionNl String?
  descriptionFr String?
  frequency     TaskFrequency @default(DAILY)
  sortOrder     Int           @default(0)
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  entries ChecklistEntry[]

  @@map("task_types")
}

model ChecklistEntry {
  id          String    @id @default(uuid())
  taskTypeId  String
  plannerId   String
  date        DateTime  @db.Date
  completedAt DateTime?
  createdAt   DateTime  @default(now())

  // Relations
  taskType TaskType @relation(fields: [taskTypeId], references: [id])
  planner  User     @relation(fields: [plannerId], references: [id])

  @@unique([taskTypeId, plannerId, date])
  @@index([plannerId, date])
  @@map("checklist_entries")
}

model AbsenceRecord {
  id        String        @id @default(uuid())
  plannerId String
  reason    AbsenceReason
  startDate DateTime      @db.Date
  endDate   DateTime?     @db.Date
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  // Relations
  planner       User                    @relation(fields: [plannerId], references: [id])
  reassignments InspectorReassignment[]

  @@index([plannerId])
  @@map("absence_records")
}

model InspectorReassignment {
  id              String    @id @default(uuid())
  inspectorId     String
  absenceRecordId String
  fromPlannerId   String
  toPlannerId     String
  createdAt       DateTime  @default(now())
  restoredAt      DateTime?

  // Relations
  inspector     Inspector     @relation(fields: [inspectorId], references: [id])
  absenceRecord AbsenceRecord @relation(fields: [absenceRecordId], references: [id])
  fromPlanner   User          @relation("FromPlanner", fields: [fromPlannerId], references: [id])
  toPlanner     User          @relation("ToPlanner", fields: [toPlannerId], references: [id])

  @@index([absenceRecordId])
  @@map("inspector_reassignments")
}
```

---

## Project Structure

```
planning-checklist/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions deployment
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── migrations/                 # Database migrations
│   └── seed.ts                     # Seed data script
├── server/
│   ├── api/                        # API routes
│   │   ├── auth/
│   │   │   ├── session.get.ts
│   │   │   ├── callback.post.ts
│   │   │   └── logout.post.ts
│   │   ├── users/
│   │   │   ├── index.get.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].patch.ts
│   │   │   └── me.get.ts
│   │   ├── inspectors/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].patch.ts
│   │   │   ├── [id].delete.ts
│   │   │   └── bulk-assign.post.ts
│   │   ├── turnover/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── summary.get.ts
│   │   │   └── export.get.ts
│   │   ├── targets/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].patch.ts
│   │   │   └── bulk.post.ts
│   │   ├── checklist/
│   │   │   ├── tasks/
│   │   │   │   ├── index.get.ts
│   │   │   │   ├── index.post.ts
│   │   │   │   └── [id].patch.ts
│   │   │   └── entries/
│   │   │       ├── index.get.ts
│   │   │       └── [id]/
│   │   │           ├── complete.post.ts
│   │   │           └── uncomplete.post.ts
│   │   ├── absences/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].patch.ts
│   │   │   ├── [id]/
│   │   │   │   ├── redistribute.post.ts
│   │   │   │   └── restore.post.ts
│   │   ├── dashboard/
│   │   │   ├── planner.get.ts
│   │   │   ├── admin.get.ts
│   │   │   └── events.get.ts       # SSE endpoint
│   │   └── reports/
│   │       ├── turnover.get.ts
│   │       ├── targets.get.ts
│   │       └── checklist.get.ts
│   ├── middleware/
│   │   ├── auth.ts                 # Authentication middleware
│   │   └── admin.ts                # Admin role check
│   ├── services/
│   │   ├── auth.service.ts         # Entra authentication
│   │   ├── user.service.ts
│   │   ├── inspector.service.ts
│   │   ├── turnover.service.ts
│   │   ├── checklist.service.ts
│   │   ├── absence.service.ts
│   │   └── sse.service.ts          # SSE event management
│   ├── utils/
│   │   ├── prisma.ts               # Prisma client instance
│   │   ├── errors.ts               # Error handling
│   │   └── validators.ts           # Input validation (Zod)
│   └── plugins/
│       └── prisma.ts               # Prisma plugin
├── app/
│   ├── components/
│   │   ├── ui/                     # Nuxt UI overrides/extensions
│   │   ├── layout/
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   └── LanguageToggle.vue
│   │   ├── dashboard/
│   │   │   ├── SummaryCard.vue
│   │   │   ├── AlertList.vue
│   │   │   └── PlannerTable.vue
│   │   ├── turnover/
│   │   │   ├── TurnoverGrid.vue
│   │   │   ├── TurnoverCell.vue
│   │   │   └── WeekSummary.vue
│   │   ├── checklist/
│   │   │   ├── ChecklistView.vue
│   │   │   └── TaskItem.vue
│   │   ├── inspectors/
│   │   │   ├── InspectorList.vue
│   │   │   ├── InspectorForm.vue
│   │   │   └── AssignmentModal.vue
│   │   └── absences/
│   │       ├── AbsenceForm.vue
│   │       └── RedistributionWizard.vue
│   ├── composables/
│   │   ├── useAuth.ts              # Authentication state
│   │   ├── useTurnover.ts          # Turnover data & calculations
│   │   ├── useChecklist.ts         # Checklist state
│   │   ├── useInspectors.ts        # Inspector management
│   │   ├── useDashboard.ts         # Dashboard data
│   │   └── useSSE.ts               # SSE connection
│   ├── stores/
│   │   ├── auth.store.ts           # User/session state
│   │   └── ui.store.ts             # UI state (sidebar, modals)
│   ├── pages/
│   │   ├── index.vue               # Redirect based on role
│   │   ├── login.vue               # Login page
│   │   ├── planner/
│   │   │   ├── index.vue           # Planner dashboard
│   │   │   ├── turnover.vue        # Turnover entry grid
│   │   │   ├── checklist.vue       # Daily checklist
│   │   │   └── summary.vue         # Weekly summary
│   │   └── admin/
│   │       ├── index.vue           # Admin dashboard
│   │       ├── inspectors.vue      # Inspector management
│   │       ├── planners.vue        # Planner management
│   │       ├── targets.vue         # Target configuration
│   │       ├── tasks.vue           # Task configuration
│   │       ├── absences.vue        # Absence management
│   │       └── reports.vue         # Reports
│   ├── layouts/
│   │   ├── default.vue             # Main app layout
│   │   └── auth.vue                # Login layout
│   └── middleware/
│       ├── auth.global.ts          # Auth check middleware
│       └── admin.ts                # Admin route protection
├── i18n/
│   ├── locales/
│   │   ├── nl.json                 # Dutch translations
│   │   └── fr.json                 # French translations
│   └── index.ts                    # i18n configuration
├── types/
│   ├── index.ts                    # Shared types
│   ├── api.ts                      # API request/response types
│   └── database.ts                 # Database types (Prisma)
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── composables/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       └── flows/
├── public/
│   └── favicon.ico
├── .env.example                    # Environment template
├── nuxt.config.ts                  # Nuxt configuration
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── Dockerfile                      # Docker build
├── docker-compose.yml              # Local development
├── package.json
└── README.md
```

---

## Frontend Architecture

### Component Architecture

**Component Organization:**
- `components/ui/` - Nuxt UI extensions and custom base components
- `components/layout/` - App shell components (header, sidebar)
- `components/[feature]/` - Feature-specific components

**Component Template:**

```typescript
// components/turnover/TurnoverCell.vue
<script setup lang="ts">
interface Props {
  inspectorId: string;
  date: Date;
  value: number | null;
  target: number;
  disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [value: number];
}>();

const { updateTurnover, isSaving } = useTurnover();

const localValue = ref(props.value);
const status = computed(() => {
  if (!localValue.value || !props.target) return 'empty';
  const ratio = localValue.value / props.target;
  if (ratio >= 1) return 'success';
  if (ratio >= 0.8) return 'warning';
  return 'error';
});

// Debounced auto-save
const debouncedSave = useDebounceFn(async () => {
  if (localValue.value !== null) {
    await updateTurnover(props.inspectorId, props.date, localValue.value);
  }
}, 500);

watch(localValue, () => debouncedSave());
</script>

<template>
  <UInput
    v-model.number="localValue"
    type="number"
    :disabled="disabled"
    :class="[
      'turnover-cell',
      `turnover-cell--${status}`,
      { 'turnover-cell--saving': isSaving }
    ]"
    @blur="debouncedSave.flush()"
  />
</template>
```

### State Management Architecture

**State Structure:**

```typescript
// stores/auth.store.ts
import { defineStore } from 'pinia';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  }),
  
  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isPlanner: (state) => state.user?.role === 'PLANNER',
    locale: (state) => state.user?.locale ?? 'nl',
  },
  
  actions: {
    async fetchSession() {
      this.isLoading = true;
      try {
        const { data } = await useFetch('/api/auth/session');
        if (data.value?.user) {
          this.user = data.value.user;
          this.isAuthenticated = true;
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' });
      this.user = null;
      this.isAuthenticated = false;
      navigateTo('/login');
    },
  },
});
```

**State Management Patterns:**
- Use Pinia stores for global state (auth, UI preferences)
- Use composables for feature-specific data fetching and state
- Use `useState` for simple page-level state
- Use `useFetch` / `useAsyncData` for server data

### Routing Architecture

**Route Organization:**

```
pages/
├── index.vue           → /                    (redirect based on role)
├── login.vue           → /login               (public)
├── planner/
│   ├── index.vue       → /planner             (planner dashboard)
│   ├── turnover.vue    → /planner/turnover    (turnover grid)
│   ├── checklist.vue   → /planner/checklist   (daily tasks)
│   └── summary.vue     → /planner/summary     (weekly summary)
└── admin/
    ├── index.vue       → /admin               (admin dashboard)
    ├── inspectors.vue  → /admin/inspectors    (inspector mgmt)
    ├── planners.vue    → /admin/planners      (planner mgmt)
    ├── targets.vue     → /admin/targets       (target config)
    ├── tasks.vue       → /admin/tasks         (task config)
    ├── absences.vue    → /admin/absences      (absence mgmt)
    └── reports.vue     → /admin/reports       (reporting)
```

**Protected Route Pattern:**

```typescript
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  
  // Public routes
  if (to.path === '/login') {
    if (auth.isAuthenticated) {
      return navigateTo(auth.isAdmin ? '/admin' : '/planner');
    }
    return;
  }
  
  // Require authentication
  if (!auth.isAuthenticated) {
    return navigateTo('/login');
  }
  
  // Admin routes require admin role
  if (to.path.startsWith('/admin') && !auth.isAdmin) {
    return navigateTo('/planner');
  }
  
  // Planner routes require planner role (admins can access too)
  if (to.path.startsWith('/planner') && auth.isAdmin) {
    // Admins can view planner pages for debugging
  }
});
```

### Frontend Services Layer

**API Client Setup:**

```typescript
// composables/useApi.ts
export function useApi() {
  const config = useRuntimeConfig();
  
  const apiFetch = $fetch.create({
    baseURL: '/api',
    onResponseError({ response }) {
      if (response.status === 401) {
        useAuthStore().logout();
      }
    },
  });
  
  return { apiFetch };
}
```

**Service Example:**

```typescript
// composables/useTurnover.ts
export function useTurnover() {
  const { apiFetch } = useApi();
  const isSaving = ref(false);
  
  const fetchWeekData = async (startDate: Date, endDate: Date) => {
    return await apiFetch<TurnoverWeekData>('/turnover', {
      params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    });
  };
  
  const updateTurnover = async (inspectorId: string, date: Date, amount: number) => {
    isSaving.value = true;
    try {
      await apiFetch('/turnover', {
        method: 'POST',
        body: { inspectorId, date: date.toISOString(), amount }
      });
    } finally {
      isSaving.value = false;
    }
  };
  
  // Calculations
  const calculateDailyTotal = (entries: TurnoverEntry[], date: Date) => {
    return entries
      .filter(e => isSameDay(new Date(e.date), date))
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };
  
  const calculateWeeklyTotal = (entries: TurnoverEntry[]) => {
    return entries.reduce((sum, e) => sum + Number(e.amount), 0);
  };
  
  const calculateSuccessDays = (
    entries: TurnoverEntry[],
    targets: TurnoverTarget[],
    dates: Date[]
  ) => {
    return dates.filter(date => {
      const dailyTotal = calculateDailyTotal(entries, date);
      const dailyTarget = targets
        .filter(t => isSameDay(new Date(t.date || ''), date) || t.isDefault)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return dailyTotal >= dailyTarget;
    }).length;
  };
  
  return {
    isSaving,
    fetchWeekData,
    updateTurnover,
    calculateDailyTotal,
    calculateWeeklyTotal,
    calculateSuccessDays,
  };
}
```

---

## Backend Architecture

### Service Architecture

**Controller/Route Organization:**

```typescript
// server/api/turnover/index.post.ts
import { z } from 'zod';
import { TurnoverService } from '~/server/services/turnover.service';

const bodySchema = z.object({
  inspectorId: z.string().uuid(),
  date: z.string().datetime(),
  amount: z.number().positive(),
});

export default defineEventHandler(async (event) => {
  // Auth middleware already ran
  const user = event.context.user;
  
  // Validate body
  const body = await readValidatedBody(event, bodySchema.parse);
  
  // Business logic in service
  const entry = await TurnoverService.upsertEntry({
    inspectorId: body.inspectorId,
    plannerId: user.id,
    date: new Date(body.date),
    amount: body.amount,
  });
  
  // Emit SSE event for real-time updates
  await SSEService.broadcast('turnover:updated', {
    plannerId: user.id,
    date: body.date,
  });
  
  return entry;
});
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Nuxt
    participant Entra as Microsoft Entra
    participant DB as PostgreSQL

    Browser->>Nuxt: GET /login
    Nuxt->>Browser: Redirect to Entra
    Browser->>Entra: User authenticates
    Entra->>Browser: Redirect with auth code
    Browser->>Nuxt: GET /api/auth/callback?code=xxx
    Nuxt->>Entra: Exchange code for tokens
    Entra->>Nuxt: Access token + ID token
    Nuxt->>DB: Find or create user by entraId
    DB->>Nuxt: User record
    Nuxt->>Browser: Set session cookie, redirect to app
```

**Auth Middleware:**

```typescript
// server/middleware/auth.ts
import { verifyToken } from '~/server/services/auth.service';

export default defineEventHandler(async (event) => {
  // Skip auth for public routes
  const publicPaths = ['/api/auth/session', '/api/auth/callback'];
  if (publicPaths.some(p => event.path.startsWith(p))) {
    return;
  }
  
  // Get session from cookie
  const session = getCookie(event, 'session');
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  
  // Verify and decode session
  const user = await verifyToken(session);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid session' });
  }
  
  // Attach user to context
  event.context.user = user;
});
```

---

## Development Workflow

### Local Development Setup

**Prerequisites:**

```bash
# Required
node >= 20.x
npm >= 10.x
docker >= 24.x
docker-compose >= 2.x
```

**Initial Setup:**

```bash
# Clone repository
git clone <repo-url>
cd planning-checklist

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your Entra app credentials

# Start PostgreSQL
docker-compose up -d postgres

# Run database migrations
npx prisma migrate dev

# Seed initial data (optional)
npx prisma db seed

# Start development server
npm run dev
```

**Development Commands:**

```bash
# Start all services (Nuxt + PostgreSQL)
docker-compose up

# Start Nuxt only (assumes PostgreSQL running)
npm run dev

# Run Prisma Studio (database GUI)
npx prisma studio

# Run tests
npm run test           # Unit tests
npm run test:e2e       # E2E tests

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Configuration

**Required Environment Variables:**

```bash
# .env

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/planning_checklist"

# Microsoft Entra ID
NUXT_ENTRA_CLIENT_ID="your-client-id"
NUXT_ENTRA_CLIENT_SECRET="your-client-secret"
NUXT_ENTRA_TENANT_ID="common"  # or specific tenant for single-tenant

# Session
NUXT_SESSION_SECRET="random-32-char-string-here"

# App
NUXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Deployment Architecture

### Deployment Strategy

**Frontend & Backend Deployment:**
- **Platform:** Easypanel (Docker)
- **Build Command:** `npm run build`
- **Output:** `.output/` directory (Nitro server bundle)
- **Docker:** Single container running Nuxt server

**Database Deployment:**
- **Platform:** Easypanel PostgreSQL service
- **Migrations:** Run via CI/CD before deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
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
    depends_on:
      - postgres
      
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

volumes:
  postgres_data:
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3000/api | Local development |
| Production | https://planning.yourdomain.com | https://planning.yourdomain.com/api | Live environment |

---

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: Strict CSP via Nuxt security module
- XSS Prevention: Vue's built-in escaping, sanitize user input
- Secure Storage: Session in httpOnly cookie, no localStorage for tokens

**Backend Security:**
- Input Validation: Zod schemas on all API endpoints
- Rate Limiting: Implement via Nuxt middleware if needed
- CORS Policy: Same-origin only (frontend and API on same domain)

**Authentication Security:**
- Token Storage: Session token in httpOnly, secure, sameSite cookie
- Session Management: Server-side sessions with database backing
- Token Expiry: 8-hour session timeout

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 200KB initial JS
- Loading Strategy: Code splitting per route, lazy load non-critical
- Caching Strategy: Static assets cached via CDN/browser, API responses use ETags

**Backend Performance:**
- Response Time Target: < 200ms for API calls
- Database Optimization: Proper indexes, query optimization via Prisma
- Caching Strategy: Consider Redis for frequently accessed data in future

---

## Testing Strategy

### Testing Pyramid

```
         E2E Tests (10%)
        /              \
    Integration Tests (30%)
   /                      \
  Unit Tests (60%)
```

### Test Organization

**Frontend Tests:**
```
tests/unit/
├── composables/
│   ├── useTurnover.test.ts
│   └── useChecklist.test.ts
└── components/
    └── turnover/
        └── TurnoverCell.test.ts
```

**Backend Tests:**
```
tests/integration/
└── api/
    ├── turnover.test.ts
    ├── inspectors.test.ts
    └── auth.test.ts
```

**E2E Tests:**
```
tests/e2e/
└── flows/
    ├── login.spec.ts
    ├── turnover-entry.spec.ts
    └── absence-management.spec.ts
```

---

## Coding Standards

### Critical Fullstack Rules

- **TypeScript Strict:** Enable strict mode, no any types without justification
- **API Validation:** All API endpoints must validate input with Zod schemas
- **Error Handling:** Use `createError()` for API errors, catch in composables
- **Database Access:** Never use Prisma directly in routes - use service layer
- **Localization:** All user-facing strings must use i18n, never hardcode
- **Auto-save:** Turnover entries auto-save with debounce, show saving state

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `TurnoverGrid.vue` |
| Composables | camelCase with 'use' | - | `useTurnover.ts` |
| Stores | camelCase with 'Store' | - | `auth.store.ts` |
| API Routes | - | kebab-case | `/api/bulk-assign` |
| Database Tables | - | snake_case | `turnover_entries` |
| Env Variables | - | SCREAMING_SNAKE | `DATABASE_URL` |

---

## Error Handling Strategy

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
}
```

### Frontend Error Handling

```typescript
// composables/useApi.ts
export function useApi() {
  const toast = useToast();
  
  const handleError = (error: any) => {
    const message = error.data?.error?.message || 'An error occurred';
    toast.add({
      title: 'Error',
      description: message,
      color: 'red',
    });
  };
  
  return { handleError };
}
```

### Backend Error Handling

```typescript
// server/utils/errors.ts
export function createApiError(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, any>
) {
  return createError({
    statusCode,
    data: {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

// Usage in route
throw createApiError(404, 'INSPECTOR_NOT_FOUND', 'Inspector not found');
```

---

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Browser console logging (add Sentry for production)
- **Backend Monitoring:** Consola logging (add structured logging for production)
- **Error Tracking:** Console errors (add Sentry for production)
- **Performance Monitoring:** Browser DevTools (add Web Vitals tracking)

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors
- API response times from client perspective

**Backend Metrics:**
- Request rate per endpoint
- Error rate (4xx, 5xx)
- Response time percentiles
- Database query performance

---

*Document created by: BMad Architect Agent*
*Workflow: greenfield-fullstack*
*Next step: PO Agent → Validate all artifacts*
