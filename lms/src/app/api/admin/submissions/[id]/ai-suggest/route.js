import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateAiGradeSuggestion, getSubmissionById } from "@/services/submissionService"

export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    if (role !== "ADMIN" && role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const submission = await getSubmissionById(id)
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const updated = await generateAiGradeSuggestion(id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("POST /api/admin/submissions/[id]/ai-suggest error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate AI suggestion" }, { status: 500 })
  }
}
