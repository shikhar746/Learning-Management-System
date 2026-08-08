"use client"

import { useState } from "react"
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function FileUpload({ onUploadComplete, label = "Upload File (PDF, DOCX, ZIP, PNG, JPG - max 10MB)" }) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setUploadedUrl(data.url)
      setFileName(data.name || file.name)
      if (onUploadComplete) {
        onUploadComplete(data.url, data.name || file.name)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {label}
      </label>
      <div className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl p-4 text-center transition-colors bg-gray-50/50">
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-600 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Uploading to Cloudinary...
          </div>
        ) : uploadedUrl ? (
          <div className="flex items-center justify-between bg-green-50 text-green-800 px-3 py-2 rounded-lg border border-green-200 text-xs font-medium">
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span className="truncate">{fileName || "Uploaded file"}</span>
            </div>
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline shrink-0 hover:text-blue-800 ml-2"
            >
              View
            </a>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center py-2">
            <UploadCloud className="w-8 h-8 text-gray-400 mb-1" />
            <span className="text-sm font-medium text-blue-600 hover:underline">
              Choose a file to upload
            </span>
            <span className="text-xs text-gray-400 mt-0.5">
              Supports PDF, DOC, ZIP, Images (up to 10MB)
            </span>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.webp,.txt"
            />
          </label>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
