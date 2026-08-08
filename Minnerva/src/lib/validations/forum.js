import { z } from "zod"

export const createTopicSchema = z.object({
  workshopId: z.string().min(1, "Workshop ID is required"),
  assignmentId: z.string().optional().nullable(),
  title: z.string().min(3, "Topic title must be at least 3 characters long"),
  description: z.string().optional(),
})

export const createPostSchema = z.object({
  topicId: z.string().min(1, "Topic ID is required"),
  content: z.string().min(2, "Post content cannot be empty"),
})

export const moderatePostSchema = z.object({
  moderationStatus: z.enum(["APPROVED", "FLAGGED", "PENDING"]),
})
