-- CreateEnum
CREATE TYPE "InspectorStatus" AS ENUM ('SICK', 'TRAINING_GIVE', 'TRAINING_TAKE', 'LEAVE');

-- AlterTable
ALTER TABLE "turnover_entries" ADD COLUMN "statusCode" "InspectorStatus";
