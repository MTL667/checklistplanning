# Project Brief: Planning Checklist Application

## Executive Summary

Transform the current Excel-based daily planning workflow into a modern web application that enables planners to manage inspector assignments, complete daily checklists, and track turnover. The application will include comprehensive admin capabilities for oversight, reporting, and handling planner absences.

## Problem Statement

### Current State
- Planners manually fill in Excel spreadsheets daily
- No centralized system for tracking inspector turnover
- When a planner is sick or absent, there's no streamlined process for redistributing their inspectors
- Limited visibility for management into daily operations
- No historical reporting or trend analysis

### Pain Points
1. **Manual data entry** - Error-prone and time-consuming Excel workflows
2. **No coverage system** - Absence of planners creates gaps in inspector management
3. **Limited oversight** - Admins lack real-time visibility into operations
4. **No historical data** - Difficult to analyze trends and performance over time

## Proposed Solution

A web-based Planning Checklist Application built with modern technologies that:
- Digitizes the daily checklist workflow
- Provides real-time dashboards for administrators
- Automates inspector reassignment during planner absences
- Tracks historical data for reporting and analysis

## User Roles

### 1. Administrators (Multiple)
**Primary Responsibilities:**
- Monitor all planner activities via real-time dashboard
- Manage inspector-to-planner assignments
- Configure custom tasks/checklist items
- Redistribute inspectors when planners are absent (sick/leave)
- Access historical reports and analytics

**Key Needs:**
- Bird's-eye view of all operations
- Quick reassignment tools for coverage situations
- Flexible task configuration without developer involvement

### 2. Planners (~5 users)
**Primary Responsibilities:**
- Complete daily checklists
- Manage calendar entries for assigned inspectors
- Record turnover (omzet) amounts per inspector
- Complete admin-configured tasks

**Key Needs:**
- Clean, efficient daily workflow interface
- Clear view of their assigned inspectors
- Easy turnover data entry

### 3. Inspectors (~50, data entities only)
- Do NOT access the application
- Represented as data records managed by planners
- Each inspector is assigned to one planner (can be reassigned by admin)

## Core Features

### Admin Module

#### Dashboard
- Real-time overview of all planners and their status
- Today's checklist completion rates
- Inspector coverage status
- Turnover vs target comparison (real-time)
- Alerts for incomplete tasks or missing data

#### Inspector Management
- View all inspectors and their current planner assignments
- Reassign inspectors between planners
- Bulk reassignment for absence coverage
- History of assignment changes

#### Turnover Target Management
- Set daily turnover targets per inspector
- Bulk target updates
- Target history tracking

#### Task Configuration
- Create/edit/delete checklist task types
- Set task frequency (daily, weekly, etc.)
- Configure required fields per task type

#### Absence Management
- Mark planner as absent (sick/leave)
- Interface to redistribute their inspectors to other planners
- Track temporary vs permanent reassignments

#### Reporting & Analytics
- Historical turnover data by inspector/planner/date range
- Target achievement analysis (actual vs target)
- **Key Metrics:**
  - Daily totals per planner
  - Average turnover per inspector
  - Weekly turnover summaries
  - Success rate (days meeting target per week)
- Checklist completion statistics
- Planner productivity metrics
- Export capabilities (CSV/Excel)

### Planner Module

#### Daily Checklist
- List of tasks to complete each day
- Configurable task types (set by admin)
- Mark tasks as complete with required data entry
- Visual progress indicator

#### Inspector Calendar
- View assigned inspectors
- Fill in calendar/schedule entries per inspector
- Quick entry interface for efficiency

#### Turnover Tracking (Calendar View)
- Daily turnover (omzet) entry per inspector in grid/calendar format
- Visual comparison against admin-set targets
- Color-coded indicators (below/on/above target)

**Automatic Calculations (from Excel):**
- **Daily total**: Sum of all inspector turnovers for the planner per day
- **Inspector average**: Average turnover per inspector (over selected period)
- **Weekly turnover**: Total turnover per week
- **Success days count**: Number of days in the week where target was achieved

## Technical Requirements

### Technology Stack
| Component | Technology |
|-----------|------------|
| Frontend Framework | Nuxt.js 3 (latest) |
| UI Components | TBD (Nuxt UI / Tailwind CSS recommended) |
| Internationalization | @nuxtjs/i18n (Dutch/French) |
| Authentication | Microsoft Entra ID (Multi-tenant) |
| Database | PostgreSQL |
| Hosting | Self-hosted via Easypanel (Docker) |
| Real-time Updates | WebSockets or Server-Sent Events |

### Non-Functional Requirements

#### Performance
- Dashboard updates in real-time (< 2 second latency)
- Page load times < 3 seconds
- Support concurrent usage by all planners + admins

#### Security
- Microsoft Entra ID authentication (multi-tenant)
- Role-based access control (Admin vs Planner)
- Secure API endpoints
- Data encryption at rest and in transit

#### Scalability
- Initial: ~5 planners, ~50 inspectors, multiple admins
- Design for 10x growth potential

#### Deployment
- Docker containerization
- Easypanel deployment configuration
- PostgreSQL managed via Easypanel

## Data Model Overview

### Core Entities
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Planner   │     │  Inspector  │
│  (Entra ID) │────▶│  Extension  │────▶│   (many)    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Checklist  │
                    │    Entry    │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Turnover  │
                    │   Record    │
                    └─────────────┘
```

### Key Relationships
- User → Role (Admin or Planner)
- Planner → Inspectors (one-to-many, reassignable)
- Planner → Checklist Entries (daily)
- Inspector → Turnover Records (daily)
- Admin → Task Configurations (CRUD)

## Success Metrics

1. **Adoption**: 100% of planners using app within 2 weeks of launch
2. **Efficiency**: 50% reduction in time spent on daily planning tasks
3. **Coverage**: Zero gaps in inspector coverage during planner absences
4. **Data Quality**: 100% daily turnover data capture rate
5. **Visibility**: Admins can access real-time status within 3 clicks

## Assumptions

1. All users have Microsoft 365 accounts for Entra authentication
2. Planners have reliable internet access during work hours
3. The existing Excel format (Checklist huishoudelijk.xlsx) represents the current workflow accurately
4. No integration with external systems required at launch
5. Users are comfortable with Dutch or French interface (both supported)
6. Excel formula logic can be replicated from the provided spreadsheet

## Out of Scope (v1)

- Mobile native applications (web responsive is sufficient)
- Leave request/approval workflow
- Integration with HR systems
- Automated inspector scheduling/optimization
- SMS/Push notifications

## Clarified Requirements

1. **Language**: Multi-language support required (Dutch/French) with language toggle
2. **Turnover targets**: Daily targets per inspector, configurable by admin
3. **Inspector details**: Name only (simple entity)
4. **Calendar/Turnover Grid**: Daily turnover amounts per inspector (the "calendar" is essentially a turnover entry matrix)
5. **Data migration**: Not required, but Excel formulas/calculations must be replicated in the app

## Open Questions

1. **Target alerts**: Should the system alert/notify when turnover is below target?
2. **French translations**: Are all terms/labels already defined in both languages, or should we define them during development?

## Project Timeline (Estimated)

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Planning & Design | 1-2 weeks | PRD, Architecture, UI Specs |
| Development Sprint 1 | 2-3 weeks | Auth, User Management, Basic CRUD |
| Development Sprint 2 | 2-3 weeks | Checklist Module, Turnover Tracking |
| Development Sprint 3 | 2 weeks | Admin Dashboard, Reporting |
| Testing & Polish | 1 week | QA, Bug fixes, Performance |
| Deployment | 1 week | Docker setup, Easypanel config |

**Total Estimated Duration**: 9-12 weeks

---

*Document created by: BMad Analyst Agent*
*Workflow: greenfield-fullstack*
*Next step: PM Agent → PRD Creation*
