import { NextResponse } from "next/server"
import { getSubmissionById } from "@/services/submissionService"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const submission = await getSubmissionById(id)

    if (!submission || submission.deletedAt) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Fetch submission detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
