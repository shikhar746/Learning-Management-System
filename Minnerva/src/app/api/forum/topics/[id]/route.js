import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTopicWithPosts } from "@/services/forumService"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // 1. Resolve topic first to get its workshopId
    const existingTopic = await db.forumTopic.findUnique({
      where: { id },
      select: { id: true, workshopId: true },
    })

    if (!existingTopic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // 2. Check UserRole permissions for (userId, workshopId)
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      existingTopic.workshopId,
      ["STUDENT", "ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Access restricted for this workshop" }, { status: 403 })
    }

    const topic = await getTopicWithPosts(id)
    return NextResponse.json(topic)
  } catch (error) {
    console.error("GET /api/forum/topics/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch topic thread" }, { status: 500 })
  }
}
