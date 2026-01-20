# Database Schema

## Prisma Schema

```prisma
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

  inspector     Inspector     @relation(fields: [inspectorId], references: [id])
  absenceRecord AbsenceRecord @relation(fields: [absenceRecordId], references: [id])
  fromPlanner   User          @relation("FromPlanner", fields: [fromPlannerId], references: [id])
  toPlanner     User          @relation("ToPlanner", fields: [toPlannerId], references: [id])

  @@index([absenceRecordId])
  @@map("inspector_reassignments")
}
```

## Entity Relationships

```
User (1) ──────< Inspector (many)
User (1) ──────< TurnoverEntry (many)
User (1) ──────< ChecklistEntry (many)
User (1) ──────< AbsenceRecord (many)

Inspector (1) ──────< TurnoverEntry (many)
Inspector (1) ──────< TurnoverTarget (many)

TaskType (1) ──────< ChecklistEntry (many)

AbsenceRecord (1) ──────< InspectorReassignment (many)
```
