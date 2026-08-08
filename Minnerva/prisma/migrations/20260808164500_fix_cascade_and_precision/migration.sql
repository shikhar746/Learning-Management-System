-- Migration: Fix Cascade Delete & Convert Float Scores to Integer Basis Points Scale

-- 1. Alter Submission score columns from DOUBLE PRECISION to INTEGER (basis points: val * 100)
ALTER TABLE "Submission"
  ALTER COLUMN "functionalityScore" TYPE INTEGER USING CASE WHEN "functionalityScore" IS NOT NULL THEN ROUND("functionalityScore" * 100)::INTEGER ELSE NULL END,
  ALTER COLUMN "qualityScore" TYPE INTEGER USING CASE WHEN "qualityScore" IS NOT NULL THEN ROUND("qualityScore" * 100)::INTEGER ELSE NULL END,
  ALTER COLUMN "aiDetectionScore" TYPE INTEGER USING CASE WHEN "aiDetectionScore" IS NOT NULL THEN ROUND("aiDetectionScore" * 100)::INTEGER ELSE NULL END,
  ALTER COLUMN "documentationScore" TYPE INTEGER USING CASE WHEN "documentationScore" IS NOT NULL THEN ROUND("documentationScore" * 100)::INTEGER ELSE NULL END,
  ALTER COLUMN "totalScore" TYPE INTEGER USING CASE WHEN "totalScore" IS NOT NULL THEN ROUND("totalScore" * 100)::INTEGER ELSE NULL END,
  ALTER COLUMN "aiSuggestedScore" TYPE INTEGER USING CASE WHEN "aiSuggestedScore" IS NOT NULL THEN ROUND("aiSuggestedScore" * 100)::INTEGER ELSE NULL END;

-- 2. Drop existing CASCADE foreign key constraint on Submission -> Assignment
ALTER TABLE "Submission" DROP CONSTRAINT IF EXISTS "Submission_assignmentId_fkey";

-- 3. Add RESTRICT foreign key constraint on Submission -> Assignment
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
