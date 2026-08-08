import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { configureTemplateSchema } from "@/lib/validations/certificate"
import { configureCertificateTemplate, getCertificateTemplate } from "@/services/certificateService"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workshopId = searchParams.get("workshopId")

    if (!workshopId) {
      return NextResponse.json({ error: "workshopId parameter is required" }, { status: 400 })
    }

    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)
    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      workshopId,
      ["STUDENT", "ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Access restricted for this workshop" }, { status: 403 })
    }

    const template = await getCertificateTemplate(workshopId)
    return NextResponse.json({ template })
  } catch (error) {
    console.error("GET /api/certificates/template error:", error)
    return NextResponse.json({ error: "Failed to fetch certificate template" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = configureTemplateSchema.parse(body)

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

    const template = await configureCertificateTemplate(validatedData)
    return NextResponse.json(template)
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/certificates/template error:", error)
    return NextResponse.json({ error: error.message || "Failed to configure template" }, { status: 500 })
  }
}
