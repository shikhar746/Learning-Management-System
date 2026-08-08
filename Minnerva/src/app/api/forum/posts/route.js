import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createPostSchema } from "@/lib/validations/forum"
import { createForumPost } from "@/services/forumService"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createPostSchema.parse(body)

    // 1. Resolve parent topic to get workshopId
    const topic = await db.forumTopic.findUnique({
      where: { id: validatedData.topicId },
      select: { id: true, workshopId: true },
    })

    if (!topic) {
      return NextResponse.json({ error: "Forum topic not found" }, { status: 404 })
    }

    // 2. Check UserRole permissions for (userId, workshopId)
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      topic.workshopId,
      ["STUDENT", "ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Access restricted for this workshop" }, { status: 403 })
    }

    const post = await createForumPost({
      ...validatedData,
      userId: session.user.id,
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/forum/posts error:", error)
    return NextResponse.json({ error: error.message || "Failed to submit post" }, { status: 500 })
  }
}
