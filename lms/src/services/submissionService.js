import { db } from "@/lib/db"

export const getSubmissions = async ({ assignmentId, userId, isAdminOrOwner }) => {
  let whereClause = { deletedAt: null }

  if (assignmentId) {
    whereClause.assignmentId = assignmentId
  }

  if (!isAdminOrOwner && userId) {
    whereClause.userId = userId
  }

  return db.submission.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      assignment: {
        select: { id: true, title: true, maxMarks: true, dueDate: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  })
}

export const getSubmissionById = async (id) => {
  return db.submission.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, githubUsername: true },
      },
      assignment: {
        select: { id: true, title: true, description: true, instructions: true, maxMarks: true },
      },
    },
  })
}

export const createOrVersionSubmission = async (userId, data) => {
  const { assignmentId, repoUrl, deploymentUrl, branch, fileUrls, comments } = data

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
  })

  if (!assignment || assignment.deletedAt) {
    throw new Error("Assignment not found")
  }

  const previousSubmissions = await db.submission.findMany({
    where: {
      assignmentId,
      userId,
      deletedAt: null,
    },
    orderBy: { version: "desc" },
  })

  if (previousSubmissions.length > 0 && !assignment.allowResubmission) {
    throw new Error("Resubmissions are disabled for this assignment")
  }

  const nextVersion = previousSubmissions.length > 0 ? previousSubmissions[0].version + 1 : 1

  return db.submission.create({
    data: {
      userId,
      assignmentId,
      version: nextVersion,
      repoUrl: repoUrl || null,
      deploymentUrl: deploymentUrl || null,
      branch: branch || "main",
      fileUrls: fileUrls || [],
      comments: comments || null,
      status: previousSubmissions.length > 0 ? "RESUBMITTED" : "SUBMITTED",
    },
  })
}

export const gradeSubmission = async (id, data) => {
  return db.submission.update({
    where: { id },
    data: {
      functionalityScore: data.functionalityScore ?? null,
      qualityScore: data.qualityScore ?? null,
      aiDetectionScore: data.aiDetectionScore ?? null,
      totalScore: data.totalScore,
      feedback: data.feedback ?? null,
      status: "GRADED",
      isGradePublished: data.isGradePublished ?? true,
    },
  })
}
