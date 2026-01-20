// Shared TypeScript types for Planning Checklist Application

// User types
export type Role = 'ADMIN' | 'PLANNER'
export type Locale = 'nl' | 'fr'

export interface User {
  id: string
  entraId: string
  email: string
  name: string
  role: Role
  locale: Locale
  createdAt: Date
  updatedAt: Date
}

// Inspector types
export interface Inspector {
  id: string
  name: string
  plannerId: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  planner?: User
}

// Turnover types
export interface TurnoverEntry {
  id: string
  inspectorId: string
  plannerId: string
  date: Date
  amount: number
  createdAt: Date
  updatedAt: Date
  inspector?: Inspector
  planner?: User
}

export interface TurnoverTarget {
  id: string
  inspectorId: string
  date: Date | null
  amount: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  inspector?: Inspector
}

// Checklist types
export type TaskFrequency = 'DAILY' | 'WEEKLY'

export interface TaskType {
  id: string
  name: string
  nameNl: string
  nameFr: string
  description: string | null
  descriptionNl: string | null
  descriptionFr: string | null
  frequency: TaskFrequency
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChecklistEntry {
  id: string
  taskTypeId: string
  plannerId: string
  date: Date
  completedAt: Date | null
  createdAt: Date
  taskType?: TaskType
  planner?: User
}

// Absence types
export type AbsenceReason = 'SICK' | 'LEAVE'

export interface AbsenceRecord {
  id: string
  plannerId: string
  reason: AbsenceReason
  startDate: Date
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
  planner?: User
}

export interface InspectorReassignment {
  id: string
  inspectorId: string
  absenceRecordId: string
  fromPlannerId: string
  toPlannerId: string
  createdAt: Date
  restoredAt: Date | null
  inspector?: Inspector
  absenceRecord?: AbsenceRecord
  fromPlanner?: User
  toPlanner?: User
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
    timestamp: string
  }
}

// Dashboard types
export interface DashboardSummary {
  totalPlanners: number
  activePlanners: number
  totalInspectors: number
  assignedInspectors: number
  todayTurnover: number
  todayTarget: number
  checklistCompletion: number
}

export interface PlannerStatus {
  id: string
  name: string
  role: Role
  isAbsent: boolean
  inspectorCount: number
  checklistCompletion: number
  todayTurnover: number
}

// Turnover calculation types
export interface TurnoverSummary {
  dailyTotal: number
  weeklyTotal: number
  inspectorAverage: number
  successDays: number
  totalDays: number
}
