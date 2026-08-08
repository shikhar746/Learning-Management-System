import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createSubmissionSchema } from "@/lib/validations/submission"
import { createSubmission, getSubmissionsForAssignment } from "@/services/submissionService"

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get("assignmentId")

    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId parameter is required" }, { status: 400 })
    }

    const submissions = await getSubmissionsForAssignment(assignmentId)
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("GET /api/submissions error:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createSubmissionSchema.parse(body)

    const submission = await createSubmission(validatedData, session.user.id)
    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/submissions error:", error)
    return NextResponse.json({ error: error.message || "Failed to submit assignment" }, { status: 400 })
  }
}
