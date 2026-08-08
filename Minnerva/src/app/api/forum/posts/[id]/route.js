import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { moderatePostSchema } from "@/lib/validations/forum"
import { moderateForumPost, deleteForumPost } from "@/services/forumService"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export async function PUT(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // 1. Resolve post -> topic -> workshopId
    const post = await db.forumPost.findUnique({
      where: { id },
      include: {
        topic: { select: { workshopId: true } },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const workshopId = post.topic?.workshopId

    // 2. Check UserRole permissions for (userId, workshopId)
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      workshopId,
      ["ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required for this workshop" }, { status: 403 })
    }

    const body = await req.json()
    const { moderationStatus } = moderatePostSchema.parse(body)

    const updated = await moderateForumPost(id, moderationStatus)
    return NextResponse.json(updated)
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("PUT /api/forum/posts/[id] error:", error)
    return NextResponse.json({ error: error.message || "Failed to update moderation status" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // 1. Resolve post -> topic -> workshopId
    const post = await db.forumPost.findUnique({
      where: { id },
      include: {
        topic: { select: { workshopId: true } },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const workshopId = post.topic?.workshopId

    // 2. Check UserRole permissions for (userId, workshopId)
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      workshopId,
      ["ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required for this workshop" }, { status: 403 })
    }

    await deleteForumPost(id)
    return NextResponse.json({ success: true, message: "Post deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/forum/posts/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
