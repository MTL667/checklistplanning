# Planning Checklist Application - Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- **Digitize daily planning workflow**: Replace manual Excel-based processes with a modern web application
- **Enable real-time oversight**: Provide administrators with live dashboards to monitor planner activities and turnover metrics
- **Streamline absence coverage**: Allow quick redistribution of inspectors when planners are sick or on leave
- **Track turnover with targets**: Enable daily turnover entry with automatic calculations and target comparisons
- **Ensure business continuity**: No gaps in inspector management regardless of planner availability
- **Support bilingual users**: Provide Dutch and French language interfaces

### Background Context

Currently, planners manage inspector assignments and track turnover using daily Excel spreadsheets. This manual process is time-consuming, error-prone, and lacks visibility for management. When a planner is absent (sick or on leave), there's no streamlined way to redistribute their inspectors to other planners, creating gaps in coverage.

The Planning Checklist Application will modernize this workflow by providing a centralized platform where planners can efficiently complete their daily tasks while administrators maintain full visibility and control over operations. The system will replicate the existing Excel calculations (daily totals, averages, weekly summaries, success day counts) while adding real-time dashboards, historical reporting, and automated absence management.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-20 | 0.1 | Initial PRD draft | PM Agent (John) |

---

## Requirements

### Functional Requirements

**Authentication & Authorization**
- FR1: Users shall authenticate via Microsoft Entra ID (multi-tenant configuration)
- FR2: System shall support two roles: Administrator and Planner
- FR3: Role-based access control shall restrict features based on user role
- FR4: Users shall be able to switch between Dutch and French languages via a toggle

**Inspector Management**
- FR5: Administrators shall be able to create, edit, and delete inspector records
- FR6: Each inspector shall have a name and be assigned to exactly one planner
- FR7: Administrators shall be able to reassign inspectors between planners
- FR8: Administrators shall be able to bulk-reassign all inspectors from one planner to others
- FR9: System shall maintain a history of inspector assignments

**Planner Management**
- FR10: Administrators shall be able to view all planners and their assigned inspectors
- FR11: Administrators shall be able to mark a planner as absent (sick/leave)
- FR12: When a planner is marked absent, system shall prompt for inspector redistribution

**Turnover Targets**
- FR13: Administrators shall be able to set daily turnover targets per inspector
- FR14: Targets shall be configurable per day (allowing different targets for different days)
- FR15: System shall display target vs actual comparisons with visual indicators

**Daily Checklist**
- FR16: Planners shall see a daily checklist of tasks to complete
- FR17: Administrators shall be able to configure checklist task types
- FR18: Planners shall be able to mark tasks as complete
- FR19: System shall track checklist completion status per planner per day

**Turnover Entry (Calendar Grid)**
- FR20: Planners shall enter daily turnover amounts per inspector in a calendar/grid view
- FR21: System shall calculate daily total turnover for each planner automatically
- FR22: System shall calculate average turnover per inspector automatically
- FR23: System shall calculate weekly turnover totals automatically
- FR24: System shall count days per week where target was achieved (success days)
- FR25: System shall display color-coded indicators for below/on/above target status

**Admin Dashboard**
- FR26: Administrators shall view a real-time dashboard showing all planner statuses
- FR27: Dashboard shall display today's checklist completion rates across all planners
- FR28: Dashboard shall show inspector coverage status (assigned vs unassigned)
- FR29: Dashboard shall display turnover vs target metrics in real-time
- FR30: Dashboard shall alert on incomplete tasks or missing turnover data

**Reporting**
- FR31: System shall provide historical turnover reports by inspector, planner, and date range
- FR32: System shall show target achievement analysis (actual vs target trends)
- FR33: System shall display success rate metrics (days meeting target per week/month)
- FR34: Reports shall be exportable to CSV and Excel formats

### Non-Functional Requirements

**Performance**
- NFR1: Dashboard shall update in real-time with less than 2 seconds latency
- NFR2: Page load times shall not exceed 3 seconds
- NFR3: System shall support concurrent usage by all planners (~5) and admins simultaneously

**Security**
- NFR4: All data transmission shall be encrypted using TLS 1.3
- NFR5: Database connections shall use SSL encryption
- NFR6: API endpoints shall validate authentication tokens on every request
- NFR7: Session timeout shall occur after 8 hours of inactivity

**Scalability**
- NFR8: System shall be designed to support 10x growth (50 planners, 500 inspectors)
- NFR9: Database schema shall support efficient queries for historical reporting

**Deployment**
- NFR10: Application shall be containerized using Docker
- NFR11: Application shall be deployable via Easypanel
- NFR12: Database shall be PostgreSQL managed through Easypanel

**Internationalization**
- NFR13: All UI text shall be externalized for translation
- NFR14: System shall support Dutch (NL) and French (FR) languages
- NFR15: Language preference shall persist per user session

**Availability**
- NFR16: System shall target 99% uptime during business hours (Mon-Fri, 7:00-19:00)

---

## User Interface Design Goals

### Overall UX Vision

A clean, efficient, and professional interface optimized for daily workflow execution. The design should minimize clicks and cognitive load for planners who perform repetitive daily tasks, while providing administrators with comprehensive oversight through intuitive dashboards. The application should feel modern yet familiar to users transitioning from Excel-based workflows.

### Key Interaction Paradigms

- **Grid-based data entry**: Turnover entry mimics familiar spreadsheet patterns for easy transition from Excel
- **Real-time updates**: Dashboard and metrics update live without page refreshes
- **Progressive disclosure**: Show essential information first, with details available on demand
- **Contextual actions**: Actions appear where relevant (e.g., reassign button near inspector)
- **Language toggle**: Persistent, easily accessible language switcher

### Core Screens and Views

**Planner Views:**
1. **Daily Dashboard**: Overview of today's tasks, assigned inspectors, and turnover entry grid
2. **Checklist View**: List of daily tasks with completion checkboxes
3. **Turnover Entry Grid**: Calendar/grid view for entering turnover amounts per inspector per day
4. **Weekly Summary**: View of weekly totals, averages, and success day counts

**Administrator Views:**
1. **Admin Dashboard**: Real-time overview of all planners, completion rates, and turnover metrics
2. **Inspector Management**: List of all inspectors with assignment status and reassignment tools
3. **Planner Management**: View planners, their status (active/absent), and assigned inspector counts
4. **Target Configuration**: Set daily turnover targets per inspector
5. **Task Configuration**: Create and manage checklist task types
6. **Absence Management**: Mark planners as absent and redistribute their inspectors
7. **Reports**: Historical reporting with filters and export options

### Accessibility

WCAG AA compliance for basic accessibility standards.

### Branding

No specific branding requirements. Clean, professional design with a neutral color palette. Use color strategically for status indicators (red/amber/green for target achievement).

### Target Device and Platforms

Web Responsive - primarily desktop usage, but should be functional on tablets. Mobile phone support is not required.

---

## Technical Assumptions

### Repository Structure

**Monorepo** - Single repository containing both frontend (Nuxt.js) and backend API code for simplified deployment and version management.

### Service Architecture

**Monolith with API separation** - Nuxt.js 3 full-stack application using:
- Nuxt server routes for API endpoints
- PostgreSQL database via Prisma ORM (or Drizzle)
- Server-sent events (SSE) or WebSockets for real-time dashboard updates

### Testing Requirements

**Unit + Integration testing**:
- Unit tests for business logic (calculations, validations)
- Integration tests for API endpoints
- E2E tests for critical user flows (login, turnover entry, absence management)

### Additional Technical Assumptions and Requests

- **Framework**: Nuxt.js 3 (latest stable version)
- **UI Library**: Nuxt UI or similar component library with Tailwind CSS
- **Authentication**: Microsoft Entra ID via @azure/msal-browser and @azure/msal-node
- **Database**: PostgreSQL (configured in Easypanel)
- **ORM**: Prisma or Drizzle ORM
- **i18n**: @nuxtjs/i18n for Dutch/French language support
- **Real-time**: Server-Sent Events (SSE) for dashboard updates (simpler than WebSockets)
- **Hosting**: Docker container deployed via Easypanel
- **Date handling**: Use date-fns or dayjs for date manipulation
- **Export**: Use xlsx library for Excel export functionality

---

## Epic List

Based on the requirements and MVP scope, I propose the following epic structure:

| Epic | Title | Goal |
|------|-------|------|
| **Epic 1** | Foundation & Authentication | Establish project infrastructure, authentication with Microsoft Entra, and basic user/role management |
| **Epic 2** | Inspector & Planner Management | Enable administrators to manage inspectors, planners, and their assignments |
| **Epic 3** | Turnover Entry & Calculations | Allow planners to enter daily turnover with automatic calculations and target comparisons |
| **Epic 4** | Daily Checklist System | Implement configurable checklist functionality for planners |
| **Epic 5** | Admin Dashboard & Real-time Updates | Provide administrators with real-time oversight dashboards |
| **Epic 6** | Absence Management & Coverage | Handle planner absences with inspector redistribution workflow |
| **Epic 7** | Reporting & Export | Historical reporting with filtering and export capabilities |

---

## Epic 1: Foundation & Authentication

**Goal**: Establish the foundational project infrastructure including Nuxt.js setup, database configuration, Microsoft Entra authentication, and basic user management. This epic delivers a working application skeleton with secure login and role-based access control.

### Story 1.1: Project Setup and Infrastructure

**As a** developer,
**I want** a properly configured Nuxt.js 3 project with all required dependencies,
**so that** I have a solid foundation to build the application features.

**Acceptance Criteria:**
1. Nuxt.js 3 project initialized with TypeScript configuration
2. Tailwind CSS and Nuxt UI (or similar) configured for styling
3. PostgreSQL database connection configured via environment variables
4. Prisma ORM installed and configured with initial schema
5. Docker configuration (Dockerfile, docker-compose) for Easypanel deployment
6. ESLint and Prettier configured for code quality
7. @nuxtjs/i18n configured with Dutch (default) and French language files
8. Basic health check API endpoint returns 200 OK
9. Application builds and runs successfully in Docker container

### Story 1.2: Microsoft Entra Authentication

**As a** user,
**I want** to log in using my Microsoft account,
**so that** I can securely access the application with my existing organizational credentials.

**Acceptance Criteria:**
1. Microsoft Entra ID (multi-tenant) authentication configured
2. Login page with "Sign in with Microsoft" button
3. Successful authentication redirects to dashboard
4. User session maintained across page refreshes
5. Logout functionality clears session and redirects to login
6. Authentication errors display user-friendly messages
7. Unauthenticated users are redirected to login page

### Story 1.3: User Registration and Role Assignment

**As an** administrator,
**I want** to manage user roles (Admin/Planner),
**so that** users have appropriate access to system features.

**Acceptance Criteria:**
1. Database schema includes User table with role field (Admin/Planner)
2. First-time authenticated users are created in database with default Planner role
3. Admin interface to view all users and their roles
4. Admin can change user role between Admin and Planner
5. Role changes take effect immediately without requiring re-login
6. User's current role is displayed in the application header

### Story 1.4: Language Toggle Implementation

**As a** user,
**I want** to switch between Dutch and French languages,
**so that** I can use the application in my preferred language.

**Acceptance Criteria:**
1. Language toggle visible in application header
2. Toggle switches between Dutch (NL) and French (FR)
3. All UI labels update immediately when language is changed
4. Language preference persists in user session/localStorage
5. Default language is Dutch
6. All static text is externalized in translation files

---

## Epic 2: Inspector & Planner Management

**Goal**: Enable administrators to manage the core entities of the system - inspectors and planners. This includes creating inspectors, assigning them to planners, and viewing/managing these relationships.

### Story 2.1: Inspector CRUD Operations

**As an** administrator,
**I want** to create, view, edit, and delete inspectors,
**so that** I can maintain the list of inspectors in the system.

**Acceptance Criteria:**
1. Admin can view list of all inspectors with their names and assigned planner
2. Admin can create new inspector with name field
3. Admin can edit inspector name
4. Admin can delete inspector (with confirmation dialog)
5. Deleting inspector with historical turnover data shows warning
6. List supports search/filter by inspector name
7. List is paginated for performance

### Story 2.2: Inspector-Planner Assignment

**As an** administrator,
**I want** to assign inspectors to planners,
**so that** each planner has a defined set of inspectors to manage.

**Acceptance Criteria:**
1. Each inspector can be assigned to exactly one planner
2. Admin can change inspector's assigned planner via dropdown
3. Unassigned inspectors are clearly indicated in the list
4. Planner assignment change is logged with timestamp
5. Admin can view assignment history for an inspector
6. Bulk assignment: select multiple inspectors and assign to one planner

### Story 2.3: Planner Overview

**As an** administrator,
**I want** to view all planners and their assigned inspector counts,
**so that** I can monitor workload distribution.

**Acceptance Criteria:**
1. Admin can view list of all users with Planner role
2. List shows inspector count per planner
3. Clicking a planner shows their assigned inspectors
4. Visual indicator for planners with no assigned inspectors
5. Visual indicator for planners marked as absent

---

## Epic 3: Turnover Entry & Calculations

**Goal**: Implement the core daily workflow for planners - entering turnover amounts per inspector with automatic calculations mirroring the existing Excel functionality.

### Story 3.1: Turnover Target Configuration

**As an** administrator,
**I want** to set daily turnover targets per inspector,
**so that** planners know what targets to achieve.

**Acceptance Criteria:**
1. Admin can set a default daily target per inspector
2. Admin can override target for specific dates
3. Target configuration interface shows current targets per inspector
4. Bulk target update: set same target for multiple inspectors
5. Target changes are logged with timestamp

### Story 3.2: Daily Turnover Entry Grid

**As a** planner,
**I want** to enter daily turnover amounts for my assigned inspectors,
**so that** I can track their daily performance.

**Acceptance Criteria:**
1. Grid view shows assigned inspectors as rows, days as columns (week view)
2. Planner can enter turnover amount per inspector per day
3. Input validates numeric values only
4. Changes auto-save (debounced) without submit button
5. Visual indicator shows saved/unsaved state
6. Cell color indicates target status: red (below), amber (close), green (met/exceeded)
7. Current day column is highlighted

### Story 3.3: Automatic Turnover Calculations

**As a** planner,
**I want** to see automatic calculations of totals and averages,
**so that** I can quickly understand performance without manual calculation.

**Acceptance Criteria:**
1. Daily total: sum of all inspector turnovers for the planner per day (row totals)
2. Inspector average: average turnover per inspector over displayed period
3. Weekly turnover: total of all turnovers for the week (grand total)
4. Success days: count of days where daily total met combined targets
5. Calculations update in real-time as turnover values are entered
6. Calculations displayed in summary row/column in the grid

### Story 3.4: Weekly Summary View

**As a** planner,
**I want** to see a summary of my weekly performance,
**so that** I can track progress toward goals.

**Acceptance Criteria:**
1. Summary shows total turnover for the week
2. Summary shows average daily turnover
3. Summary shows success days count (days target was met)
4. Summary shows target achievement percentage
5. Week navigation: previous/next week buttons
6. Comparison to previous week performance

---

## Epic 4: Daily Checklist System

**Goal**: Implement the configurable daily checklist that planners must complete, allowing administrators to define task types.

### Story 4.1: Checklist Task Type Configuration

**As an** administrator,
**I want** to configure the types of checklist tasks,
**so that** I can customize what planners need to complete daily.

**Acceptance Criteria:**
1. Admin can create new task types with name and description
2. Admin can edit existing task types
3. Admin can deactivate task types (soft delete)
4. Admin can set task frequency (daily, weekly, etc.)
5. Admin can reorder tasks to set display priority
6. Changes to task types reflect immediately for planners

### Story 4.2: Daily Checklist Display and Completion

**As a** planner,
**I want** to view and complete my daily checklist,
**so that** I can track my required tasks.

**Acceptance Criteria:**
1. Checklist shows all active tasks for today
2. Planner can mark tasks as complete with checkbox
3. Completed tasks show completion timestamp
4. Checklist progress indicator (e.g., "3/5 complete")
5. Tasks persist completion status for the day
6. New day resets checklist to uncompleted state
7. Visual distinction between completed and pending tasks

### Story 4.3: Checklist Completion Tracking

**As an** administrator,
**I want** to see checklist completion status for all planners,
**so that** I can monitor task compliance.

**Acceptance Criteria:**
1. Admin view shows all planners with today's completion status
2. Completion percentage displayed per planner
3. Click on planner shows their detailed checklist status
4. Historical view of completion rates by date
5. Alert indicator for planners with incomplete checklists at end of day

---

## Epic 5: Admin Dashboard & Real-time Updates

**Goal**: Provide administrators with a comprehensive real-time dashboard for monitoring all planner activities, turnover metrics, and system status.

### Story 5.1: Admin Dashboard Layout

**As an** administrator,
**I want** a dashboard overview of all system activity,
**so that** I can monitor operations at a glance.

**Acceptance Criteria:**
1. Dashboard displays summary cards: total planners, total inspectors, today's turnover
2. Card showing checklist completion rate across all planners
3. Card showing turnover vs target achievement
4. Card showing planner availability (active vs absent)
5. Dashboard is the default landing page for admin users
6. Responsive layout works on desktop and tablet

### Story 5.2: Real-time Dashboard Updates

**As an** administrator,
**I want** the dashboard to update in real-time,
**so that** I see current information without refreshing.

**Acceptance Criteria:**
1. Implement Server-Sent Events (SSE) connection for real-time updates
2. Turnover entries by planners update dashboard within 2 seconds
3. Checklist completions update dashboard within 2 seconds
4. Connection status indicator shows live/disconnected state
5. Automatic reconnection if connection is lost
6. Graceful fallback to polling if SSE is unavailable

### Story 5.3: Detailed Planner Status View

**As an** administrator,
**I want** to drill down into individual planner details,
**so that** I can see their specific status and metrics.

**Acceptance Criteria:**
1. Click on planner in dashboard opens detail view
2. Detail view shows assigned inspectors list
3. Detail view shows today's turnover entries
4. Detail view shows checklist completion status
5. Detail view shows weekly performance summary
6. Quick actions: mark absent, reassign inspectors

---

## Epic 6: Absence Management & Coverage

**Goal**: Handle planner absences by providing workflow to mark planners as absent and redistribute their inspectors to other planners.

### Story 6.1: Mark Planner as Absent

**As an** administrator,
**I want** to mark a planner as absent,
**so that** I can indicate they are not available.

**Acceptance Criteria:**
1. Admin can mark planner as absent with reason (sick/leave)
2. Absent status shows clearly in planner list
3. Absent planners are visually distinguished on dashboard
4. Absence start date is recorded
5. Admin can mark planner as returned/active
6. Absence history is maintained

### Story 6.2: Inspector Redistribution Workflow

**As an** administrator,
**I want** to redistribute an absent planner's inspectors,
**so that** coverage is maintained.

**Acceptance Criteria:**
1. When planner is marked absent, prompt to redistribute inspectors
2. Show list of absent planner's inspectors
3. Dropdown to select target planner for each inspector
4. Option to distribute evenly across all active planners
5. Option to assign all to a single planner
6. Redistribution marked as temporary (linked to absence)
7. Confirmation before applying redistribution

### Story 6.3: Return from Absence

**As an** administrator,
**I want** inspectors to be restored when a planner returns,
**so that** original assignments are maintained.

**Acceptance Criteria:**
1. When planner is marked as returned, option to restore inspectors
2. Show which inspectors were temporarily reassigned
3. One-click restore all original assignments
4. Option to keep current assignments instead
5. Restoration is logged in assignment history

---

## Epic 7: Reporting & Export

**Goal**: Provide historical reporting capabilities with filtering options and export functionality.

### Story 7.1: Turnover History Report

**As an** administrator,
**I want** to view historical turnover data,
**so that** I can analyze performance trends.

**Acceptance Criteria:**
1. Report shows turnover data with date range filter
2. Filter by planner (single or multiple)
3. Filter by inspector (single or multiple)
4. Results show daily turnover amounts
5. Summary row shows totals and averages
6. Results sortable by date, planner, inspector, amount

### Story 7.2: Target Achievement Report

**As an** administrator,
**I want** to see target achievement analysis,
**so that** I can identify performance patterns.

**Acceptance Criteria:**
1. Report shows actual vs target comparison
2. Achievement percentage per inspector
3. Achievement percentage per planner
4. Trend visualization (chart/graph)
5. Filter by date range
6. Highlight consistently under-performing inspectors

### Story 7.3: Export Functionality

**As an** administrator,
**I want** to export reports to Excel/CSV,
**so that** I can analyze data externally or share with stakeholders.

**Acceptance Criteria:**
1. Export button on all report views
2. Export to CSV format
3. Export to Excel (.xlsx) format
4. Export includes all visible data with current filters applied
5. Export filename includes report type and date range
6. Large exports handled without timeout (async if needed)

---

## Checklist Results Report

*To be completed after PRD review and approval.*

---

## Next Steps

### UX Expert Prompt

> Create a frontend specification for the Planning Checklist Application based on the attached PRD. Focus on the planner's daily workflow (turnover entry grid, checklist) and the admin dashboard. The application must support Dutch and French languages and use Nuxt UI components.

### Architect Prompt

> Create a fullstack architecture document for the Planning Checklist Application based on the attached PRD. Tech stack: Nuxt.js 3, PostgreSQL, Microsoft Entra authentication, Docker/Easypanel deployment. Include database schema, API design, and real-time update strategy using SSE.
