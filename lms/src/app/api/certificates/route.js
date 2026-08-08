import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCertificateForStudent } from "@/services/certificateService"

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workshopId = searchParams.get("workshopId")
    const targetUserId = searchParams.get("userId") || session.user.id

    if (!workshopId) {
      return NextResponse.json({ error: "workshopId parameter is required" }, { status: 400 })
    }

    const certificate = await getCertificateForStudent(workshopId, targetUserId)
    return NextResponse.json({ certificate })
  } catch (error) {
    console.error("GET /api/certificates error:", error)
    return NextResponse.json({ error: "Failed to fetch certificate" }, { status: 500 })
  }
}
