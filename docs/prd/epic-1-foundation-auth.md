# Epic 1: Foundation & Authentication

**Goal**: Establish the foundational project infrastructure including Nuxt.js setup, database configuration, Microsoft Entra authentication, and basic user management. This epic delivers a working application skeleton with secure login and role-based access control.

---

## Story 1.1: Project Setup and Infrastructure

**Status:** Draft

**As a** developer,
**I want** a properly configured Nuxt.js 3 project with all required dependencies,
**so that** I have a solid foundation to build the application features.

### Acceptance Criteria

1. Nuxt.js 3 project initialized with TypeScript configuration
2. Tailwind CSS and Nuxt UI configured for styling
3. PostgreSQL database connection configured via environment variables
4. Prisma ORM installed and configured with initial schema
5. Docker configuration (Dockerfile, docker-compose) for Easypanel deployment
6. ESLint and Prettier configured for code quality
7. @nuxtjs/i18n configured with Dutch (default) and French language files
8. Basic health check API endpoint returns 200 OK
9. Application builds and runs successfully in Docker container

### Technical Notes

- Use `npx nuxi init` with latest Nuxt 3
- Install: `@nuxt/ui`, `@nuxtjs/i18n`, `@prisma/client`, `prisma`
- Create initial Prisma schema with User model
- Docker should use multi-stage build for smaller image

---

## Story 1.2: Microsoft Entra Authentication

**Status:** Draft

**As a** user,
**I want** to log in using my Microsoft account,
**so that** I can securely access the application with my existing organizational credentials.

### Acceptance Criteria

1. Microsoft Entra ID (multi-tenant) authentication configured
2. Login page with "Sign in with Microsoft" button
3. Successful authentication redirects to dashboard
4. User session maintained across page refreshes
5. Logout functionality clears session and redirects to login
6. Authentication errors display user-friendly messages
7. Unauthenticated users are redirected to login page

### Technical Notes

- Use `@azure/msal-browser` for frontend auth flow
- Use `@azure/msal-node` for token validation on server
- Store session in httpOnly cookie
- Implement auth middleware for protected routes

---

## Story 1.3: User Registration and Role Assignment

**Status:** Draft

**As an** administrator,
**I want** to manage user roles (Admin/Planner),
**so that** users have appropriate access to system features.

### Acceptance Criteria

1. Database schema includes User table with role field (Admin/Planner)
2. First-time authenticated users are created in database with default Planner role
3. Admin interface to view all users and their roles
4. Admin can change user role between Admin and Planner
5. Role changes take effect immediately without requiring re-login
6. User's current role is displayed in the application header

### Technical Notes

- User model: id, entraId, email, name, role, locale, timestamps
- First user should be manually set as ADMIN in database
- Role enum: ADMIN, PLANNER

---

## Story 1.4: Language Toggle Implementation

**Status:** Draft

**As a** user,
**I want** to switch between Dutch and French languages,
**so that** I can use the application in my preferred language.

### Acceptance Criteria

1. Language toggle visible in application header
2. Toggle switches between Dutch (NL) and French (FR)
3. All UI labels update immediately when language is changed
4. Language preference persists in user session/localStorage
5. Default language is Dutch
6. All static text is externalized in translation files

### Technical Notes

- Use @nuxtjs/i18n with `nl` and `fr` locales
- Create `i18n/locales/nl.json` and `i18n/locales/fr.json`
- Store preference in user record and localStorage as fallback
