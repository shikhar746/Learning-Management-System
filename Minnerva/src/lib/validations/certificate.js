import { z } from "zod"

export const configureTemplateSchema = z.object({
  workshopId: z.string().min(1, "Workshop ID is required"),
  templateUrl: z.string().url("Invalid template URL"),
  nameX: z.number().default(300),
  nameY: z.number().default(400),
  fontSize: z.number().default(36),
})

export const issueCertificateSchema = z.object({
  workshopId: z.string().min(1, "Workshop ID is required"),
  userId: z.string().min(1, "User ID is required"),
})
