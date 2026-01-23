-- Add sortOrder to inspectors for planner-defined ordering
ALTER TABLE "inspectors" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
