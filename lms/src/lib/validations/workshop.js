import { z } from "zod"

export const createWorkshopSchema = z.object({
  name: z.string().min(3, "Workshop name must be at least 3 characters long"),
  description: z.string().optional(),
  code: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim().toUpperCase() : undefined)),
  validUntil: z.string().optional().nullable(),
  aiProvider: z.enum(["CLAUDE", "GEMINI", "KIMI", "OPENAI", "DEFAULT"]).optional().default("DEFAULT"),
  aiApiKey: z.string().optional().nullable(),
})

export const updateWorkshopSchema = z.object({
  name: z.string().min(3, "Workshop name must be at least 3 characters long").optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  validUntil: z.string().optional().nullable(),
  aiProvider: z.enum(["CLAUDE", "GEMINI", "KIMI", "OPENAI", "DEFAULT"]).optional(),
  aiApiKey: z.string().optional().nullable(),
})

export const joinWorkshopSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
})

export const inviteAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
})
