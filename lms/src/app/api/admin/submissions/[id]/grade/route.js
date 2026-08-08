import { NextResponse } from "next/server"
import { gradeSubmissionSchema } from "@/lib/validations/submission"
import { gradeSubmission } from "@/services/submissionService"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

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
    const result = gradeSubmissionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const updatedSubmission = await gradeSubmission(id, result.data)
    return NextResponse.json(updatedSubmission)
  } catch (error) {
    console.error("Grade submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
