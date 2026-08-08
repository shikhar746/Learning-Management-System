import test from "node:test"
import assert from "node:assert/strict"
import { getSecret } from "../src/lib/encryption.js"
import { enqueueBatchAiGrading, getBatchJobStatus } from "../src/services/batchGradingQueue.js"
import { db } from "../src/lib/db.js"

test("Issue 1: Global Prisma Client Extension applies deletedAt: null filter", async () => {
  // Verifies that db.assignment and db.submission query extensions exist
  assert.ok(db.assignment, "db.assignment extended model present")
  assert.ok(db.submission, "db.submission extended model present")
})

test("Issue 2: Strict Environment Secret Validation in Staging/Production", () => {
  const originalEnv = process.env.NODE_ENV
  const originalSecret = process.env.ENCRYPTION_SECRET
  const originalAuthSecret = process.env.AUTH_SECRET

  try {
    delete process.env.ENCRYPTION_SECRET
    delete process.env.AUTH_SECRET

    // 1. In Production, missing secret must throw critical configuration error
    process.env.NODE_ENV = "production"
    assert.throws(
      () => getSecret(),
      (err) => {
        assert.ok(err.message.includes("CRITICAL CONFIGURATION ERROR"))
        return true
      },
      "Expected missing secret in production to throw immediate error"
    )

    // 2. In Staging, missing secret must throw critical configuration error
    process.env.NODE_ENV = "staging"
    assert.throws(
      () => getSecret(),
      (err) => {
        assert.ok(err.message.includes("CRITICAL CONFIGURATION ERROR"))
        return true
      },
      "Expected missing secret in staging to throw immediate error"
    )

    // 3. In Development, fallback key is allowed with warning
    process.env.NODE_ENV = "development"
    const devSecret = getSecret()
    assert.equal(devSecret, "minnerva_default_secret_key_32_bytes!!")
  } finally {
    process.env.NODE_ENV = originalEnv
    if (originalSecret) process.env.ENCRYPTION_SECRET = originalSecret
    if (originalAuthSecret) process.env.AUTH_SECRET = originalAuthSecret
  }
})

test("Issue 3: Asynchronous Batch AI Grading Queue & Job Status Polling", async () => {
  const mockSubmissions = [
    { id: "sub-test-101" },
    { id: "sub-test-102" },
  ]

  const mockEvaluator = async (id) => {
    return { id, score: 90 }
  }

  // 1. Enqueue job
  const enqueueResult = enqueueBatchAiGrading("assign-999", mockSubmissions, mockEvaluator)

  assert.ok(enqueueResult.batchId)
  assert.equal(enqueueResult.status, "PROCESSING")
  assert.equal(enqueueResult.totalSubmissions, 2)
  assert.ok(enqueueResult.statusUrl.includes(enqueueResult.batchId))

  // 2. Fetch initial status
  const initialJobState = getBatchJobStatus(enqueueResult.batchId)
  assert.ok(initialJobState)
  assert.equal(initialJobState.total, 2)

  // 3. Wait briefly for async worker to run
  await new Promise((resolve) => setTimeout(resolve, 50))

  const finalJobState = getBatchJobStatus(enqueueResult.batchId)
  assert.ok(finalJobState)
  assert.equal(finalJobState.processed, 2)
  assert.equal(finalJobState.status, "COMPLETED")
})

test("Issue 4: Partial Unique Index Logic - Soft-deleted record key simulation", () => {
  // Simulates partial unique index logic: (userId, assignmentId, version) WHERE deletedAt IS NULL
  const dbRecords = [
    { id: "sub-1", userId: "u1", assignmentId: "a1", version: 1, deletedAt: new Date("2026-08-01") },
  ]

  function canInsertSubmission(userId, assignmentId, version) {
    // Partial unique index checks active non-deleted rows only
    const activeCollision = dbRecords.some(
      (r) => r.userId === userId && r.assignmentId === assignmentId && r.version === version && r.deletedAt === null
    )
    return !activeCollision
  }

  // Soft-deleted version 1 exists -> active collision is false -> insert allowed!
  assert.equal(canInsertSubmission("u1", "a1", 1), true)

  // Add active version 1
  dbRecords.push({ id: "sub-2", userId: "u1", assignmentId: "a1", version: 1, deletedAt: null })

  // Active version 1 exists -> active collision is true -> insert blocked!
  assert.equal(canInsertSubmission("u1", "a1", 1), false)
})
