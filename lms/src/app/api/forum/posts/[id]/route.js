import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { moderatePostSchema } from "@/lib/validations/forum"
import { moderateForumPost, deleteForumPost } from "@/services/forumService"

export async function PUT(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    if (role !== "ADMIN" && role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    const { id } = await params
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

    const role = session.user.role
    if (role !== "ADMIN" && role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    const { id } = await params
    await deleteForumPost(id)
    return NextResponse.json({ success: true, message: "Post deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/forum/posts/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
