-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLANNER');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('nl', 'fr');

-- CreateEnum
CREATE TYPE "AbsenceReason" AS ENUM ('SICK', 'LEAVE');

-- CreateEnum
CREATE TYPE "TaskFrequency" AS ENUM ('DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "entraId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLANNER',
    "locale" "Locale" NOT NULL DEFAULT 'nl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspectors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plannerId" TEXT,
    "defaultTarget" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnover_entries" (
    "id" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "plannerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnover_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnover_targets" (
    "id" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "date" DATE,
    "amount" DECIMAL(10,2) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnover_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionNl" TEXT,
    "descriptionFr" TEXT,
    "frequency" "TaskFrequency" NOT NULL DEFAULT 'DAILY',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_entries" (
    "id" TEXT NOT NULL,
    "taskTypeId" TEXT NOT NULL,
    "plannerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absence_records" (
    "id" TEXT NOT NULL,
    "plannerId" TEXT NOT NULL,
    "reason" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absence_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspector_reassignments" (
    "id" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "absenceId" TEXT NOT NULL,
    "temporaryPlannerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMP(3),

    CONSTRAINT "inspector_reassignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_entraId_key" ON "users"("entraId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "turnover_entries_inspectorId_date_key" ON "turnover_entries"("inspectorId", "date");

-- CreateIndex
CREATE INDEX "turnover_entries_plannerId_date_idx" ON "turnover_entries"("plannerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "turnover_targets_inspectorId_date_key" ON "turnover_targets"("inspectorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_entries_taskTypeId_plannerId_date_key" ON "checklist_entries"("taskTypeId", "plannerId", "date");

-- CreateIndex
CREATE INDEX "checklist_entries_plannerId_date_idx" ON "checklist_entries"("plannerId", "date");

-- CreateIndex
CREATE INDEX "absence_records_plannerId_idx" ON "absence_records"("plannerId");

-- CreateIndex
CREATE UNIQUE INDEX "inspector_reassignments_absenceId_inspectorId_key" ON "inspector_reassignments"("absenceId", "inspectorId");

-- CreateIndex
CREATE INDEX "inspector_reassignments_absenceId_idx" ON "inspector_reassignments"("absenceId");

-- AddForeignKey
ALTER TABLE "inspectors" ADD CONSTRAINT "inspectors_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_entries" ADD CONSTRAINT "turnover_entries_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "inspectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_entries" ADD CONSTRAINT "turnover_entries_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_targets" ADD CONSTRAINT "turnover_targets_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "inspectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_records" ADD CONSTRAINT "absence_records_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspector_reassignments" ADD CONSTRAINT "inspector_reassignments_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "inspectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspector_reassignments" ADD CONSTRAINT "inspector_reassignments_absenceId_fkey" FOREIGN KEY ("absenceId") REFERENCES "absence_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspector_reassignments" ADD CONSTRAINT "inspector_reassignments_temporaryPlannerId_fkey" FOREIGN KEY ("temporaryPlannerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
