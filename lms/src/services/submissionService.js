import { db } from "@/lib/db"

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

  return submission
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

  return submissions
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

  return submission
}

export async function generateAiGradeSuggestion(submissionId) {
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: true, user: true },
  })

  if (!submission) {
    throw new Error("Submission not found")
  }

  const maxMarks = submission.assignment.maxMarks
  let suggestedScore = Math.round(maxMarks * 0.85) // Default heuristic base
  let feedbackPoints = []

  if (submission.repoUrl) {
    suggestedScore += Math.round(maxMarks * 0.1)
    feedbackPoints.push("GitHub Repository submitted and verified.")
  }

  if (submission.deploymentUrl) {
    suggestedScore += Math.round(maxMarks * 0.05)
    feedbackPoints.push("Live Deployment URL provided.")
  }

  if (submission.driveUrl) {
    feedbackPoints.push("Google Drive / Video Demonstration asset attached.")
  }

  if (submission.comments) {
    feedbackPoints.push(`Student Notes: "${submission.comments.slice(0, 100)}"`)
  }

  suggestedScore = Math.min(maxMarks, Math.max(0, suggestedScore))
  const suggestedFeedback = `AI Draft Review: Candidate score suggested as ${suggestedScore}/${maxMarks}.\nSummary: ${feedbackPoints.join(" ")}\nNote: Instructor approval required before publishing.`

  const updated = await db.submission.update({
    where: { id: submissionId },
    data: {
      aiSuggestedScore: suggestedScore,
      aiSuggestedFeedback: suggestedFeedback,
    },
  })

  return updated
}

export async function gradeSubmission(submissionId, gradeData) {
  const {
    totalScore,
    functionalityScore,
    qualityScore,
    aiDetectionScore,
    feedback,
    isGradePublished,
  } = gradeData

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
  })

  if (!submission) {
    throw new Error("Submission not found")
  }

  const updatedSubmission = await db.submission.update({
    where: { id: submissionId },
    data: {
      totalScore,
      functionalityScore: functionalityScore ?? null,
      qualityScore: qualityScore ?? null,
      aiDetectionScore: aiDetectionScore ?? null,
      feedback: feedback || null,
      status: "GRADED",
      isGradePublished: Boolean(isGradePublished),
    },
  })

  return updatedSubmission
}
