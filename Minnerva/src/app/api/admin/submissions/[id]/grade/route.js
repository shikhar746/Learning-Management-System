import { NextResponse } from "next/server"
import { gradeSubmissionSchema } from "@/lib/validations/submission"
import { gradeSubmission } from "@/services/submissionService"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export async function PUT(req, { params }) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
