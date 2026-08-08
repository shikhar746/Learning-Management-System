import { db } from "../lib/db.js"
import { evaluateSubmissionWithByok } from "./aiGradingService.js"
import { sendGradeNotification } from "./notificationService.js"
import { invalidateCachePattern } from "../lib/redis.js"

/**
 * Converts basis point integer (e.g. 8550) back to standard score float/number (85.5)
 */
export function formatScoreFromBasisPoints(val) {
  if (val === null || val === undefined) return null
  return Math.round(val)
}

/**
 * Converts input score to integer marks
 */
export function parseScoreToBasisPoints(val) {
  if (val === null || val === undefined || val === "") return null
  const num = typeof val === "number" ? val : parseFloat(val)
  if (isNaN(num)) return null
  return Math.round(num)
}

/**
 * Formats all submission score fields from integer basis points to display numbers
 */
export function formatSubmissionScores(sub) {
  if (!sub) return null
  return {
    ...sub,
    totalScore: formatScoreFromBasisPoints(sub.totalScore),
    functionalityScore: formatScoreFromBasisPoints(sub.functionalityScore),
    qualityScore: formatScoreFromBasisPoints(sub.qualityScore),
    aiDetectionScore: formatScoreFromBasisPoints(sub.aiDetectionScore),
    documentationScore: formatScoreFromBasisPoints(sub.documentationScore),
    aiSuggestedScore: formatScoreFromBasisPoints(sub.aiSuggestedScore),
  }
}

export async function createSubmission(data, userId) {
  const { assignmentId, repoUrl, deploymentUrl, driveUrl, branch, fileUrls, comments } = data

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
  })

  if (!assignment) {
    throw new Error("Assignment not found")
  }

  if (assignment.deletedAt) {
    throw new Error("Assignment has been deleted")
  }

  if (!assignment.published) {
    throw new Error("Assignment is not open for submission")
  }

  const existingSubmissions = await db.submission.findMany({
    where: { assignmentId, userId, deletedAt: null },
    orderBy: { version: "desc" },
  })

  if (existingSubmissions.length > 0 && !assignment.allowResubmission) {
    throw new Error("Resubmissions are disabled for this assignment")
  }

  const nextVersion = existingSubmissions.length > 0 ? existingSubmissions[0].version + 1 : 1

  const submission = await db.submission.create({
    data: {
      userId,
      assignmentId,
      version: nextVersion,
      repoUrl: repoUrl || null,
      deploymentUrl: deploymentUrl || null,
      driveUrl: driveUrl || null,
      branch: branch || "main",
      fileUrls: fileUrls || [],
      comments: comments || null,
      status: "SUBMITTED",
      isGradePublished: false,
    },
    include: {
      assignment: {
        select: { title: true, maxMarks: true, enableAiGrading: true },
      },
    },
  })

  // Invalidate cached analytics upon new submission
  invalidateCachePattern("analytics:")

  return formatSubmissionScores(submission)
}

export async function getSubmissionsForAssignment(assignmentId) {
  const submissions = await db.submission.findMany({
    where: { assignmentId, deletedAt: null },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  })

  return submissions.map(formatSubmissionScores)
}

export async function getSubmissionById(submissionId) {
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      assignment: true,
    },
  })

  return formatSubmissionScores(submission)
}

export async function generateAiGradeSuggestion(submissionId) {
  const res = await evaluateSubmissionWithByok(submissionId)
  return formatSubmissionScores(res)
}

export async function gradeSubmission(submissionId, gradeData) {
  const {
    totalScore,
    functionalityScore,
    qualityScore,
    aiDetectionScore,
    documentationScore,
    feedback,
    isGradePublished,
  } = gradeData

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: { user: true, assignment: true },
  })

  if (!submission) {
    throw new Error("Submission not found")
  }

  const updatedSubmission = await db.submission.update({
    where: { id: submissionId },
    data: {
      totalScore: parseScoreToBasisPoints(totalScore),
      functionalityScore: parseScoreToBasisPoints(functionalityScore),
      qualityScore: parseScoreToBasisPoints(qualityScore),
      aiDetectionScore: parseScoreToBasisPoints(aiDetectionScore),
      documentationScore: parseScoreToBasisPoints(documentationScore),
      feedback: feedback || null,
      status: "GRADED",
      isGradePublished: Boolean(isGradePublished),
    },
    include: {
      user: { select: { email: true, name: true } },
      assignment: { select: { title: true, maxMarks: true } },
    },
  })

  // Invalidate cached analytics upon grading
  invalidateCachePattern("analytics:")

  const formatted = formatSubmissionScores(updatedSubmission)

  if (Boolean(isGradePublished) && updatedSubmission.user?.email) {
    sendGradeNotification(formatted, updatedSubmission.user.email).catch((err) =>
      console.error("Email notification error:", err)
    )
  }

  return formatted
}
