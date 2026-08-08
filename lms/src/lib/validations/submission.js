import { z } from "zod"

export const createSubmissionSchema = z
  .object({
    assignmentId: z.string().min(1, "Assignment ID is required"),
    repoUrl: z.string().url("Invalid repository URL").optional().or(z.literal("")),
    deploymentUrl: z.string().url("Invalid deployment URL").optional().or(z.literal("")),
    driveUrl: z.string().url("Invalid Google Drive or Video URL").optional().or(z.literal("")),
    branch: z.string().default("main"),
    fileUrls: z.array(z.string()).default([]),
    comments: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.repoUrl && data.repoUrl.trim().length > 0) ||
      Boolean(data.deploymentUrl && data.deploymentUrl.trim().length > 0) ||
      Boolean(data.driveUrl && data.driveUrl.trim().length > 0) ||
      Boolean(data.fileUrls && data.fileUrls.length > 0) ||
      Boolean(data.comments && data.comments.trim().length > 0),
    {
      message: "Please provide at least one submission artifact (GitHub URL, Live Demo URL, Drive Video link, File attachment, or Notes).",
    }
  )

export const gradeSubmissionSchema = z.object({
  totalScore: z.number().min(0, "Score cannot be negative"),
  functionalityScore: z.number().min(0).optional().nullable(),
  qualityScore: z.number().min(0).optional().nullable(),
  aiDetectionScore: z.number().min(0).optional().nullable(),
  feedback: z.string().optional(),
  isGradePublished: z.boolean().default(false),
})

export const aiSuggestSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
})
