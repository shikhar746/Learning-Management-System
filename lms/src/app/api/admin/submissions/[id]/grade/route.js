import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

const gradeSchema = z.object({
  functionalityScore: z.number().min(0).optional().nullable(),
  qualityScore: z.number().min(0).max(100).optional().nullable(),
  aiDetectionScore: z.number().min(0).max(100).optional().nullable(),
  totalScore: z.number().min(0, "Total score cannot be negative"),
  feedback: z.string().optional().nullable(),
  isGradePublished: z.boolean().optional().default(true),
})

export async function PUT(req, { params }) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const result = gradeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const {
      functionalityScore,
      qualityScore,
      aiDetectionScore,
      totalScore,
      feedback,
      isGradePublished,
    } = result.data

    const updatedSubmission = await db.submission.update({
      where: { id },
      data: {
        functionalityScore: functionalityScore ?? null,
        qualityScore: qualityScore ?? null,
        aiDetectionScore: aiDetectionScore ?? null,
        totalScore,
        feedback: feedback ?? null,
        status: "GRADED",
        isGradePublished: isGradePublished ?? true,
      },
    })

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    console.error("Grade submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
