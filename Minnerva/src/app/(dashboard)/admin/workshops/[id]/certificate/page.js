"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CertificateDownloadCard from "@/components/shared/CertificateDownloadCard"
import FileUpload from "@/components/shared/FileUpload"
import { Award, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Sparkles, Send } from "lucide-react"

export default function AdminCertificateConfigPage({ params }) {
  const { id: workshopId } = use(params)
  const [workshop, setWorkshop] = useState(null)
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [msg, setMsg] = useState({ error: "", success: "" })

  const [formData, setFormData] = useState({
    templateUrl: "https://res.cloudinary.com/dxeuly7xo/image/upload/v1/certificates/default_template.png",
    nameX: 300,
    nameY: 400,
    fontSize: 36,
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/workshops/${workshopId}`).then((res) => res.json()),
      fetch(`/api/certificates/template?workshopId=${workshopId}`).then((res) => res.json()),
    ])
      .then(([workshopData, templateData]) => {
        if (!workshopData.error) setWorkshop(workshopData)
        if (templateData.template) {
          setTemplate(templateData.template)
          setFormData({
            templateUrl: templateData.template.templateUrl || "",
            nameX: templateData.template.nameX || 300,
            nameY: templateData.template.nameY || 400,
            fontSize: templateData.template.fontSize || 36,
          })
        }
      })
      .catch((err) => console.error("Failed to load certificate settings:", err))
      .finally(() => setLoading(false))
  }, [workshopId])

  const handleSaveTemplate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg({ error: "", success: "" })

    try {
      const res = await fetch("/api/certificates/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          ...formData,
          nameX: Number(formData.nameX),
          nameY: Number(formData.nameY),
          fontSize: Number(formData.fontSize),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to save template")
      }

      setTemplate(data)
      setMsg({ success: "Certificate template configuration saved!", error: "" })
    } catch (err) {
      setMsg({ error: err.message, success: "" })
    } finally {
      setSaving(false)
    }
  }

  const handleIssueAllCertificates = async () => {
    if (!workshop?.students || workshop.students.length === 0) {
      alert("No enrolled students found in this workshop cohort.")
      return
    }

    setIssuing(true)
    setMsg({ error: "", success: "" })

    try {
      let count = 0
      for (const student of workshop.students) {
        await fetch("/api/certificates/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workshopId, userId: student.id }),
        })
        count++
      }

      setMsg({ success: `Successfully issued certificates to ${count} enrolled participants!`, error: "" })
    } catch (err) {
      setMsg({ error: "Error during certificate issuance batch", success: "" })
    } finally {
      setIssuing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600 mr-2" />
        <span>Loading certificate settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/workshops/${workshopId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Control Room
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-600" />
              Certificate Generator & Template Setup
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload institutional certificate templates and dynamically issue certificates to cohort participants.
            </p>
          </div>
        </div>

        <Button
          onClick={handleIssueAllCertificates}
          disabled={issuing || !workshop?.students?.length}
          className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
        >
          {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Issue Certificates to All ({workshop?.students?.length ?? 0})
        </Button>
      </div>

      {msg.error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{msg.error}</span>
        </div>
      )}

      {msg.success && (
        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{msg.success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Template Config Form */}
        <form onSubmit={handleSaveTemplate} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
            Institutional Template Configuration
          </h3>

          <FileUpload
            label="Upload Certificate Image Template (PNG / JPG)"
            onUploadComplete={(url) => setFormData((prev) => ({ ...prev, templateUrl: url }))}
          />

          <div className="space-y-1">
            <Label htmlFor="templateUrl" className="text-xs">Template Image Asset URL</Label>
            <Input
              id="templateUrl"
              required
              value={formData.templateUrl}
              onChange={(e) => setFormData({ ...formData, templateUrl: e.target.value })}
              className="text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="nameX" className="text-xs">Participant Name X-Position</Label>
              <Input
                id="nameX"
                type="number"
                value={formData.nameX}
                onChange={(e) => setFormData({ ...formData, nameX: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nameY" className="text-xs">Participant Name Y-Position</Label>
              <Input
                id="nameY"
                type="number"
                value={formData.nameY}
                onChange={(e) => setFormData({ ...formData, nameY: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fontSize" className="text-xs">Font Size (px)</Label>
              <Input
                id="fontSize"
                type="number"
                value={formData.fontSize}
                onChange={(e) => setFormData({ ...formData, fontSize: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full text-xs">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
            Save Certificate Settings
          </Button>
        </form>

        {/* Right Column: Certificate Preview Card */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Sample Student Certificate Preview</h3>
          <CertificateDownloadCard
            certificate={{
              id: "sample-preview",
              certificateUrl: formData.templateUrl,
              issuedAt: new Date().toISOString(),
            }}
            participantName="Sample Student Name"
            workshopName={workshop?.name || "Workshop Cohort"}
          />
        </div>
      </div>
    </div>
  )
}
