import { z } from "zod"
import { isIpOrInternalHost } from "../urlSafety.js"

export const createSubmissionSchema = z
  .object({
    assignmentId: z.string().min(1, "Assignment ID is required"),
    repoUrl: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val || val.trim().length === 0) return true
          if (isIpOrInternalHost(val)) return false
          try {
            const raw = /^https?:\/\//i.test(val) ? val : `https://${val}`
            const u = new URL(raw)
            if (u.protocol !== "https:") return false
            const host = u.hostname.toLowerCase()
            if (isIpOrInternalHost(host)) return false
            if (host !== "github.com" && host !== "www.github.com") return false
            return /^\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)(\.git|\/|$)/.test(u.pathname)
          } catch {
            return false
          }
        },
        {
          message: "Invalid GitHub repository URL (e.g. https://github.com/owner/repository). IP addresses and non-GitHub hosts are forbidden.",
        }
      ),
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
  documentationScore: z.number().min(0).optional().nullable(),
  feedback: z.string().optional(),
  isGradePublished: z.boolean().default(false),
})

export const aiSuggestSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
})
