import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { issueCertificateSchema } from "@/lib/validations/certificate"
import { issueCertificate } from "@/services/certificateService"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = issueCertificateSchema.parse(body)

    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      validatedData.workshopId,
      ["ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required for this workshop" }, { status: 403 })
    }

    const certificate = await issueCertificate(validatedData)
    return NextResponse.json(certificate, { status: 201 })
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/certificates/issue error:", error)
    return NextResponse.json({ error: error.message || "Failed to issue certificate" }, { status: 500 })
  }
}
