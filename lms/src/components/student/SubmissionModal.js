"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FileUpload from "@/components/shared/FileUpload"
import { AlertCircle, Loader2, GitBranch, ExternalLink, FileText, CheckCircle2, Video } from "lucide-react"

export default function SubmissionModal({ assignment, previousSubmissions = [], onSubmitted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    repoUrl: "",
    deploymentUrl: "",
    driveUrl: "",
    branch: "main",
    fileUrls: [],
    comments: "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment.id,
          ...formData,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Submission failed")
      }

      setSuccess(true)
      setFormData({ repoUrl: "", deploymentUrl: "", branch: "main", fileUrls: [], comments: "" })
      if (onSubmitted) onSubmitted(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const latestSubmission = previousSubmissions[0]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Submit Work</h3>
        <p className="text-xs text-gray-500 mt-1">
          Provide your GitHub Repository URL, Live Deployment link, or upload attachment files.
        </p>
      </div>

      {previousSubmissions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
            <span>Current Status: {latestSubmission.status} (v{latestSubmission.version})</span>
            <span>Submitted: {new Date(latestSubmission.submittedAt).toLocaleDateString()}</span>
          </div>

          {latestSubmission.isGradePublished && latestSubmission.totalScore !== null && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <span className="text-sm font-bold text-green-700">
                Grade: {latestSubmission.totalScore} / {assignment.maxMarks}
              </span>
              {latestSubmission.feedback && (
                <p className="text-xs text-gray-700 italic mt-1">
                  "{latestSubmission.feedback}"
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Submission recorded successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repoUrl" className="flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-gray-500" />
            GitHub Repository URL
          </Label>
          <Input
            id="repoUrl"
            type="url"
            placeholder="https://github.com/username/repo-name"
            value={formData.repoUrl}
            onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deploymentUrl" className="flex items-center gap-1.5">
            <ExternalLink className="w-4 h-4 text-gray-500" />
            Live Deployment URL (Optional)
          </Label>
          <Input
            id="deploymentUrl"
            type="url"
            placeholder="https://my-app.vercel.app"
            value={formData.deploymentUrl}
            onChange={(e) => setFormData({ ...formData, deploymentUrl: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="driveUrl" className="flex items-center gap-1.5">
            <Video className="w-4 h-4 text-purple-500" />
            Google Drive / Video Demo Link (Optional)
          </Label>
          <Input
            id="driveUrl"
            type="url"
            placeholder="https://drive.google.com/... or Loom / YouTube link"
            value={formData.driveUrl}
            onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
          />
        </div>

        <FileUpload
          label="Attachment File (ZIP / PDF / Code Bundle)"
          onUploadComplete={(url) =>
            setFormData((prev) => ({
              ...prev,
              fileUrls: [...prev.fileUrls, url],
            }))
          }
        />

        {formData.fileUrls.length > 0 && (
          <div className="text-xs text-gray-500 space-y-1">
            {formData.fileUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-blue-600 truncate">
                <FileText className="w-3.5 h-3.5" />
                <a href={url} target="_blank" rel="noreferrer" className="underline truncate">
                  {url}
                </a>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="comments">Additional Notes / Comments</Label>
          <textarea
            id="comments"
            rows={3}
            className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any comments for the evaluator..."
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {previousSubmissions.length > 0 ? "Submit Resubmission" : "Submit Assignment"}
        </Button>
      </form>
    </div>
  )
}
