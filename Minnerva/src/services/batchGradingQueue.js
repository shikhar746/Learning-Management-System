import { evaluateSubmissionWithByok } from "./aiGradingService.js"

// Memory & cache store for tracking active batch AI grading jobs
const batchJobsStore = new Map()

/**
 * Enqueues a batch AI grading job and processes it asynchronously off the request thread.
 * Returns immediately with { batchId, status: "PROCESSING", totalSubmissions, statusUrl }
 */
export function enqueueBatchAiGrading(assignmentId, submissionList, evaluatorFn = evaluateSubmissionWithByok) {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  const jobState = {
    batchId,
    assignmentId,
    status: "PROCESSING",
    total: submissionList.length,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  batchJobsStore.set(batchId, jobState)

  // Execute evaluation asynchronously off the HTTP request thread
  setTimeout(() => processBatchGradingAsync(batchId, submissionList, evaluatorFn), 10)

  return {
    batchId,
    status: jobState.status,
    totalSubmissions: jobState.total,
    message: `Batch AI grading job enqueued for ${submissionList.length} submissions. Use GET /api/admin/submissions/batch?batchId=${batchId} to poll status.`,
    statusUrl: `/api/admin/submissions/batch?batchId=${batchId}`,
  }
}

/**
 * Gets the current status of a batch grading job by batchId.
 */
export function getBatchJobStatus(batchId) {
  if (!batchId) return null
  return batchJobsStore.get(batchId) || null
}

/**
 * Async background worker that evaluates each submission with error isolation and status tracking
 */
async function processBatchGradingAsync(batchId, submissionList, evaluatorFn) {
  const job = batchJobsStore.get(batchId)
  if (!job) return

  for (const sub of submissionList) {
    try {
      await evaluatorFn(sub.id)
      job.successful++
    } catch (err) {
      console.error(`[Batch AI Queue] Error evaluating submission ${sub.id}:`, err.message)
      job.failed++
      job.errors.push({
        submissionId: sub.id,
        error: err.message || "Evaluation failed",
      })
    } finally {
      job.processed++
      job.updatedAt = new Date().toISOString()
    }
  }

  job.status = job.failed === job.total ? "FAILED" : "COMPLETED"
  job.updatedAt = new Date().toISOString()
}
