"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import CertificateDownloadCard from "@/components/shared/CertificateDownloadCard"
import WorkshopCloseoutBanner from "@/components/shared/WorkshopCloseoutBanner"
import { Award, ArrowLeft, Loader2, AlertCircle } from "lucide-react"

export default function StudentWorkshopCertificatePage({ params }) {
  const { id: workshopId } = use(params)
  const [details, setDetails] = useState(null)
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/workshops/${workshopId}`).then((res) => res.json()),
      fetch(`/api/certificates?workshopId=${workshopId}`).then((res) => res.json()),
    ])
      .then(([workshopData, certData]) => {
        if (!workshopData.error) setDetails(workshopData)
        if (certData.certificate) setCertificate(certData.certificate)
      })
      .catch((err) => console.error("Failed to load certificate closeout details:", err))
      .finally(() => setLoading(false))
  }, [workshopId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600 mr-2" />
        <span>Loading workshop closeout details...</span>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Workshop Details Not Found</h2>
        <Link href="/student/workshops">
          <Button variant="outline">Back to Workshops</Button>
        </Link>
      </div>
    )
  }

  const adminEmails = details.admins?.map((a) => a.email) || []

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/student/workshops">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Workshops
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{details.name} — Closeout</h1>
      </div>

      <WorkshopCloseoutBanner
        workshopName={details.name}
        adminEmails={adminEmails}
        validUntil={details.validUntil}
      />

      <div className="pt-4 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Your Certificate of Completion
          </h2>
          <p className="text-xs text-gray-500">Official certificate issued by workshop instructors.</p>
        </div>

        <CertificateDownloadCard
          certificate={certificate}
          workshopName={details.name}
        />
      </div>
    </div>
  )
}
