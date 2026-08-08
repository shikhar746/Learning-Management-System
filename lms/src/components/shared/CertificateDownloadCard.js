"use client"

import { Button } from "@/components/ui/button"
import { Award, Download, ExternalLink, CheckCircle } from "lucide-react"

export default function CertificateDownloadCard({ certificate, participantName, workshopName }) {
  if (!certificate) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center space-y-2">
        <Award className="w-8 h-8 text-gray-400 mx-auto" />
        <h3 className="text-sm font-semibold text-gray-700">Certificate Pending</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Your official certificate of participation for <span className="font-medium text-gray-800">{workshopName}</span> will be issued upon workshop completion.
        </p>
      </div>
    )
  }

  const nameToRender = participantName || certificate.user?.name || certificate.user?.email || "Participant"

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 space-y-4 max-w-xl mx-auto shadow-sm">
      <div className="flex items-center justify-between border-b border-amber-200 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-600" />
          <div>
            <h3 className="font-bold text-amber-950">Official Certificate of Participation</h3>
            <p className="text-xs text-amber-700">{workshopName}</p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Issued
        </span>
      </div>

      <div className="relative bg-white border border-amber-300 rounded-lg p-8 text-center space-y-3 shadow-inner">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">This Certifies That</span>
        <h2 className="text-2xl font-extrabold text-gray-900 font-serif underline decoration-amber-400 decoration-2">
          {nameToRender}
        </h2>
        <p className="text-xs text-gray-600 max-w-xs mx-auto">
          has successfully completed all requirements and assignments for <span className="font-semibold text-gray-800">{workshopName}</span>.
        </p>
        <span className="block text-[10px] text-gray-400 pt-2">
          Issued on: {new Date(certificate.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <a href={certificate.certificateUrl} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="border-amber-300 text-amber-900 hover:bg-amber-100">
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Direct Link
          </Button>
        </a>
        <a href={certificate.certificateUrl} download={`Certificate_${nameToRender}.pdf`}>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download Certificate
          </Button>
        </a>
      </div>
    </div>
  )
}
