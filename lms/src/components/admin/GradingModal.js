"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, CheckCircle2, Award, Bot, Code, ExternalLink, GitBranch, FileText } from "lucide-react"

export default function GradingModal({ submission, assignment, onGraded }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    totalScore: submission.totalScore ?? "",
    functionalityScore: submission.functionalityScore ?? "",
    qualityScore: submission.qualityScore ?? "",
    aiDetectionScore: submission.aiDetectionScore ?? "",
    feedback: submission.feedback || "",
    isGradePublished: submission.isGradePublished ?? true,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalScore: Number(formData.totalScore),
          functionalityScore: formData.functionalityScore !== "" ? Number(formData.functionalityScore) : null,
          qualityScore: formData.qualityScore !== "" ? Number(formData.qualityScore) : null,
          aiDetectionScore: formData.aiDetectionScore !== "" ? Number(formData.aiDetectionScore) : null,
          feedback: formData.feedback,
          isGradePublished: formData.isGradePublished,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Grading failed")
      }

      setSuccess(true)
      if (onGraded) onGraded(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Evaluate Submission (v{submission.version})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Student: <span className="font-medium text-gray-800">{submission.user?.name || submission.user?.email}</span>
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-800">
          {submission.status}
        </span>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-xs">
        <h4 className="font-semibold text-gray-700 uppercase tracking-wider mb-2">Student Artifacts</h4>
        {submission.repoUrl && (
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-600">Repository:</span>
            <a href={submission.repoUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate hover:text-blue-800">
              {submission.repoUrl}
            </a>
          </div>
        )}
        {submission.deploymentUrl && (
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-600">Live Demo:</span>
            <a href={submission.deploymentUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate hover:text-blue-800">
              {submission.deploymentUrl}
            </a>
          </div>
        )}
        {submission.fileUrls?.length > 0 && (
          <div className="space-y-1">
            <span className="font-medium text-gray-600">Attachments:</span>
            {submission.fileUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2 pl-2">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate hover:text-blue-800">
                  {url}
                </a>
              </div>
            ))}
          </div>
        )}
        {submission.comments && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600 italic">
            Student Comment: "{submission.comments}"
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Grade & feedback saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="totalScore" className="flex items-center gap-1.5 font-bold">
            <Award className="w-4 h-4 text-yellow-600" />
            Final Marks / Score (Max: {assignment.maxMarks})
          </Label>
          <Input
            id="totalScore"
            type="number"
            min={0}
            max={assignment.maxMarks}
            required
            placeholder="e.g. 85"
            value={formData.totalScore}
            onChange={(e) => setFormData({ ...formData, totalScore: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="funcScore" className="text-xs flex items-center gap-1 text-gray-600">
              <Code className="w-3.5 h-3.5" /> Functionality Score
            </Label>
            <Input
              id="funcScore"
              type="number"
              min={0}
              placeholder="e.g. 90"
              className="text-xs"
              value={formData.functionalityScore}
              onChange={(e) => setFormData({ ...formData, functionalityScore: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qualScore" className="text-xs flex items-center gap-1 text-gray-600">
              <Code className="w-3.5 h-3.5 text-blue-500" /> Code Quality Score
            </Label>
            <Input
              id="qualScore"
              type="number"
              min={0}
              max={100}
              placeholder="Sandbox Hook (0-100)"
              className="text-xs"
              value={formData.qualityScore}
              onChange={(e) => setFormData({ ...formData, qualityScore: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aiScore" className="text-xs flex items-center gap-1 text-gray-600">
              <Bot className="w-3.5 h-3.5 text-purple-500" /> AI Detection Score %
            </Label>
            <Input
              id="aiScore"
              type="number"
              min={0}
              max={100}
              placeholder="AI Hook (0-100%)"
              className="text-xs"
              value={formData.aiDetectionScore}
              onChange={(e) => setFormData({ ...formData, aiDetectionScore: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="feedback">Instructor Feedback & Comments</Label>
          <textarea
            id="feedback"
            rows={4}
            className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Constructive feedback for the student..."
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isGradePublished"
            checked={formData.isGradePublished}
            onChange={(e) => setFormData({ ...formData, isGradePublished: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          <Label htmlFor="isGradePublished" className="text-sm font-medium text-gray-700 cursor-pointer">
            Publish Grade to Student Immediately
          </Label>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save & Submit Evaluation
        </Button>
      </form>
    </div>
  )
}
