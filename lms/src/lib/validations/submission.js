import { z } from "zod"

export const createSubmissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  repoUrl: z.string().url("Invalid Repository URL").optional().or(z.literal("")),
  deploymentUrl: z.string().url("Invalid Deployment URL").optional().or(z.literal("")),
  branch: z.string().optional().default("main"),
  fileUrls: z.array(z.string()).optional().default([]),
  comments: z.string().optional(),
})

export const gradeSubmissionSchema = z.object({
  functionalityScore: z.number().min(0).optional().nullable(),
  qualityScore: z.number().min(0).max(100).optional().nullable(),
  aiDetectionScore: z.number().min(0).max(100).optional().nullable(),
  totalScore: z.number().min(0, "Total score cannot be negative"),
  feedback: z.string().optional().nullable(),
  isGradePublished: z.boolean().optional().default(true),
})
