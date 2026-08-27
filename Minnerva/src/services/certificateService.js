import { db } from "@/lib/db"

export async function configureCertificateTemplate({ workshopId, templateUrl, nameX, nameY, fontSize }) {
  const workshop = await db.workshop.findUnique({
    where: { id: workshopId },
  })

  if (!workshop) {
    throw new Error("Workshop not found")
  }

  const existingTemplate = await db.certificateTemplate.findUnique({
    where: { workshopId },
  })

  if (existingTemplate) {
    return await db.certificateTemplate.update({
      where: { workshopId },
      data: {
        templateUrl,
        nameX: nameX ?? 300,
        nameY: nameY ?? 400,
        fontSize: fontSize ?? 36,
      },
    })
  }

  return await db.certificateTemplate.create({
    data: {
      workshopId,
      templateUrl,
      nameX: nameX ?? 300,
      nameY: nameY ?? 400,
      fontSize: fontSize ?? 36,
    },
  })
}

export async function getCertificateTemplate(workshopId) {
  return await db.certificateTemplate.findUnique({
    where: { workshopId },
  })
}

/**
 * Inserts a Cloudinary text-overlay transformation into a template image URL so the
 * participant's name is actually rendered into the delivered image, positioned using
 * the template's configured nameX/nameY/fontSize.
 */
function buildCertificateImageUrl(baseTemplateUrl, name, template) {
  const uploadMarker = "/image/upload/"
  const markerIndex = baseTemplateUrl.indexOf(uploadMarker)
  if (markerIndex === -1) {
    // Not a Cloudinary delivery URL we know how to transform; serve the template as-is
    return baseTemplateUrl
  }

  const nameX = template?.nameX ?? 300
  const nameY = template?.nameY ?? 400
  const fontSize = template?.fontSize ?? 36

  const encodedText = encodeURIComponent(name)
  const overlay = `l_text:Arial_${fontSize}_bold:${encodedText},co_rgb:1a1a1a/fl_layer_apply,g_north_west,x_${nameX},y_${nameY}`

  const insertAt = markerIndex + uploadMarker.length
  return `${baseTemplateUrl.slice(0, insertAt)}${overlay}/${baseTemplateUrl.slice(insertAt)}`
}

export async function issueCertificate({ workshopId, userId }) {
  const workshop = await db.workshop.findUnique({
    where: { id: workshopId },
  })

  if (!workshop) {
    throw new Error("Workshop not found")
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const template = await db.certificateTemplate.findUnique({
    where: { workshopId },
  })

  // Renders the participant's name directly into the certificate image via a Cloudinary
  // text-overlay transformation, positioned using the template's nameX/nameY/fontSize.
  const baseTemplateUrl = template?.templateUrl || "https://res.cloudinary.com/dxeuly7xo/image/upload/v1/certificates/default_template.png"
  const certificateUrl = buildCertificateImageUrl(baseTemplateUrl, user.name || user.email, template)

  const existingCert = await db.certificate.findUnique({
    where: {
      workshopId_userId: {
        workshopId,
        userId,
      },
    },
  })

  if (existingCert) {
    return existingCert
  }

  const certificate = await db.certificate.create({
    data: {
      workshopId,
      userId,
      certificateUrl,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      workshop: { select: { id: true, name: true } },
    },
  })

  return certificate
}

export async function getCertificateForStudent(workshopId, userId) {
  const certificate = await db.certificate.findUnique({
    where: {
      workshopId_userId: {
        workshopId,
        userId,
      },
    },
    include: {
      workshop: {
        include: {
          certificateTemplate: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return certificate
}

export async function getWorkshopCloseoutDetails(workshopId) {
  const workshop = await db.workshop.findUnique({
    where: { id: workshopId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      userRoles: {
        where: { role: "ADMIN" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      certificateTemplate: true,
    },
  })

  if (!workshop) return null

  const adminEmails = workshop.userRoles.map((r) => r.user.email)
  if (!adminEmails.includes(workshop.createdBy.email)) {
    adminEmails.push(workshop.createdBy.email)
  }

  const isClosed = workshop.status === "COMPLETED" || (workshop.validUntil && new Date() > new Date(workshop.validUntil))

  return {
    workshop,
    isClosed,
    adminEmails,
  }
}
