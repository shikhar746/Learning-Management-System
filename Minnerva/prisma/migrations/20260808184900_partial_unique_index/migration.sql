-- Migration: PostgreSQL Partial Unique Index for Soft-Deleted Submissions

-- 1. Drop old full-table unique constraint if present
ALTER TABLE "Submission" DROP CONSTRAINT IF EXISTS "Submission_userId_assignmentId_version_key";

-- 2. Drop existing index if present
DROP INDEX IF EXISTS "Submission_userId_assignmentId_version_key";

-- 3. Create PostgreSQL partial unique index WHERE "deletedAt" IS NULL
CREATE UNIQUE INDEX "Submission_userId_assignmentId_version_key" 
ON "Submission" ("userId", "assignmentId", "version") 
WHERE "deletedAt" IS NULL;
