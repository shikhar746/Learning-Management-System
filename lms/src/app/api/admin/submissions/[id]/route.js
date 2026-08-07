import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/auth"

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

    const submission = await db.submission.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, githubUsername: true },
        },
        assignment: {
          select: { id: true, title: true, description: true, instructions: true, maxMarks: true },
        },
      },
    })

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
