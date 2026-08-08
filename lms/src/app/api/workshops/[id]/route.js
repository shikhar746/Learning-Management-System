import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateWorkshopSchema } from "@/lib/validations/workshop"
import { getWorkshopById, updateWorkshop, deleteWorkshop } from "@/services/workshopService"

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const workshop = await getWorkshopById(id, session.user.id)
    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    return NextResponse.json(workshop)
  } catch (error) {
    console.error("GET /api/workshops/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch workshop" }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const workshop = await getWorkshopById(id, session.user.id)
    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    const isAuthorized =
      session.user.role === "OWNER" ||
      workshop.currentUserRole === "ADMIN" ||
      workshop.currentUserRole === "OWNER"

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = updateWorkshopSchema.parse(body)

    const updated = await updateWorkshop(id, validatedData)
    return NextResponse.json(updated)
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("PUT /api/workshops/[id] error:", error)
    return NextResponse.json({ error: error.message || "Failed to update workshop" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const workshop = await getWorkshopById(id, session.user.id)
    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    const isAuthorized =
      session.user.role === "OWNER" ||
      workshop.createdById === session.user.id

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: Only workshop creator or owner can delete" }, { status: 403 })
    }

    await deleteWorkshop(id)
    return NextResponse.json({ success: true, message: "Workshop deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/workshops/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete workshop" }, { status: 500 })
  }
}
