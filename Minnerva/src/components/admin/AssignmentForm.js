"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FileUpload from "@/components/shared/FileUpload"
import { AlertCircle, Loader2, ShieldCheck, Sparkles } from "lucide-react"

export default function AssignmentForm({ initialData = null, isEditing = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [workshops, setWorkshops] = useState([])

  const [formData, setFormData] = useState({
    workshopId: initialData?.workshopId || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    instructions: initialData?.instructions || "",
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().slice(0, 16)
      : "",
    maxMarks: initialData?.maxMarks || 100,
    allowResubmission: initialData?.allowResubmission ?? true,
    enableAiGrading: initialData?.enableAiGrading ?? true,
    attachments: initialData?.attachments || [],
    published: initialData?.published ?? true,
  })

  useEffect(() => {
    fetch("/api/workshops")
      .then((res) => res.json())
      .then((data) => {
        if (data.workshops) setWorkshops(data.workshops)
      })
      .catch((err) => console.error("Failed to load workshops:", err))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const url = isEditing
        ? `/api/assignments/${initialData.id}`
        : "/api/assignments"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          workshopId: formData.workshopId || null,
          maxMarks: Number(formData.maxMarks),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to save assignment")
      }

      router.push("/admin/assignments")
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 max-w-3xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="workshopId" className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          Target Workshop Cohort (Multi-Tenant Isolation)
        </Label>
        <select
          id="workshopId"
          className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.workshopId}
          onChange={(e) => setFormData({ ...formData, workshopId: e.target.value })}
        >
          <option value="">Global (General Task across platform)</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} (Code: {w.code})
            </option>
          ))}
        </select>
        <p className="text-[11px] text-gray-400">Restricts visibility of this task strictly to students enrolled in this cohort.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Assignment Title</Label>
        <Input
          id="title"
          required
          placeholder="e.g., Final Project - Full Stack App"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short Overview / Description</Label>
        <Input
          id="description"
          required
          placeholder="Brief summary of requirements..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Detailed Instructions (Markdown / Text)</Label>
        <textarea
          id="instructions"
          required
          rows={6}
          className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Step-by-step submission guidelines..."
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date & Time</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxMarks">Maximum Marks</Label>
          <Input
            id="maxMarks"
            type="number"
            min={1}
            required
            value={formData.maxMarks}
            onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
          />
        </div>
      </div>

      <FileUpload
        label="Assignment Resource / Starter Materials Attachment"
        onUploadComplete={(url) =>
          setFormData((prev) => ({
            ...prev,
            attachments: [...prev.attachments, url],
          }))
        }
      />

      {formData.attachments.length > 0 && (
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">Uploaded Attachments:</p>
          {formData.attachments.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block text-blue-600 underline truncate hover:text-blue-800"
            >
              {url}
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={formData.allowResubmission}
            onChange={(e) =>
              setFormData({ ...formData, allowResubmission: e.target.checked })
            }
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          Allow Resubmissions
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={formData.enableAiGrading}
            onChange={(e) =>
              setFormData({ ...formData, enableAiGrading: e.target.checked })
            }
            className="w-4 h-4 text-purple-600 rounded border-gray-300"
          />
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Enable HITL AI Draft Assistance
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={formData.published}
            onChange={(e) =>
              setFormData({ ...formData, published: e.target.checked })
            }
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          Publish Assignment Immediately
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/assignments")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isEditing ? "Update Assignment" : "Publish Assignment"}
        </Button>
      </div>
    </form>
  )
}
