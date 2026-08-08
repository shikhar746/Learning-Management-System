import { z } from "zod"

export const createAssignmentSchema = z.object({
  workshopId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  instructions: z.string().min(1, "Instructions are required"),
  dueDate: z.string().optional().nullable(),
  maxMarks: z.number().min(1, "Max marks must be greater than 0"),
  allowResubmission: z.boolean().optional().default(true),
  enableAiGrading: z.boolean().optional().default(true),
  requireDocumentation: z.boolean().optional().default(false),
  gradingCriteria: z.any().optional(),
  attachments: z.array(z.string()).optional().default([]),
  published: z.boolean().optional().default(false),
})

export const updateAssignmentSchema = z.object({
  workshopId: z.string().optional().nullable(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  instructions: z.string().min(1).optional(),
  dueDate: z.string().optional().nullable(),
  maxMarks: z.number().min(1).optional(),
  allowResubmission: z.boolean().optional(),
  enableAiGrading: z.boolean().optional(),
  requireDocumentation: z.boolean().optional(),
  gradingCriteria: z.any().optional(),
  attachments: z.array(z.string()).optional(),
  published: z.boolean().optional(),
})
