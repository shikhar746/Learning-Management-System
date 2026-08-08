import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateAiGradeSuggestion } from "@/services/submissionService"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // 1. Resolve submission first to get its parent assignment's workshopId
    const existingSubmission = await db.submission.findUnique({
      where: { id },
      include: {
        assignment: { select: { workshopId: true } },
      },
    })

    if (!existingSubmission || existingSubmission.deletedAt) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const workshopId = existingSubmission.assignment?.workshopId

    // 2. Check UserRole permissions for (userId, workshopId)
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      workshopId,
      ["ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin access required for this workshop" }, { status: 403 })
    }

    const updated = await generateAiGradeSuggestion(id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("POST /api/admin/submissions/[id]/ai-suggest error:", error)
    const msg = error.message || "Failed to generate AI suggestion"

    const isApiKeyError =
      msg.toLowerCase().includes("api key") ||
      msg.toLowerCase().includes("unauthorized") ||
      msg.toLowerCase().includes("401") ||
      msg.toLowerCase().includes("invalid_api_key")

    const isValidationError =
      isApiKeyError ||
      msg.includes("IP address") ||
      msg.includes("forbidden") ||
      msg.includes("Invalid hostname") ||
      msg.includes("Only official github.com") ||
      msg.includes("Invalid URL") ||
      msg.includes("Invalid GitHub")

    const errorMessage = isApiKeyError
      ? "AI API Key is missing or invalid. Please configure a valid API Key in AI Settings."
      : msg

    const status = isValidationError ? 400 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}
