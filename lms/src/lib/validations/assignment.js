import { z } from "zod"

export const createAssignmentSchema = z.object({
  workshopId: z.string().optional().nullable(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  instructions: z.string().min(10, "Instructions must be at least 10 characters"),
  dueDate: z.string().optional().nullable(),
  maxMarks: z.number().min(1, "Max marks must be greater than 0"),
  allowResubmission: z.boolean().optional().default(true),
  enableAiGrading: z.boolean().optional().default(true),
  attachments: z.array(z.string()).optional().default([]),
  published: z.boolean().optional().default(false),
})

export const updateAssignmentSchema = z.object({
  workshopId: z.string().optional().nullable(),
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  instructions: z.string().min(10).optional(),
  dueDate: z.string().optional().nullable(),
  maxMarks: z.number().min(1).optional(),
  allowResubmission: z.boolean().optional(),
  enableAiGrading: z.boolean().optional(),
  attachments: z.array(z.string()).optional(),
  published: z.boolean().optional(),
})
