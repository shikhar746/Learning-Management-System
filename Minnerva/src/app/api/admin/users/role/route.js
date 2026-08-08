import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentRole = session.user.role
    if (currentRole !== "ADMIN" && currentRole !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Admin or Owner access required" }, { status: 403 })
    }

    const { targetUserId, newRole } = await req.json()

    if (!targetUserId || !newRole) {
      return NextResponse.json({ error: "targetUserId and newRole are required" }, { status: 400 })
    }

    if (!["STUDENT", "ADMIN", "OWNER"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 })
    }

    // Only OWNER can assign OWNER role
    if (newRole === "OWNER" && currentRole !== "OWNER") {
      return NextResponse.json({ error: "Only system Owner can assign the OWNER role" }, { status: 403 })
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent demoting the system owner
    if (targetUser.role === "OWNER" && currentRole !== "OWNER") {
      return NextResponse.json({ error: "Cannot modify Super-Admin Owner account" }, { status: 403 })
    }

    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("POST /api/admin/users/role error:", error)
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
  }
}
