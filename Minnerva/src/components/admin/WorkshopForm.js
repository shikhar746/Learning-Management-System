"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Key, Calendar } from "lucide-react"

export default function WorkshopForm({ initialData = null, isEditing = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    code: initialData?.code || "",
    validUntil: initialData?.validUntil
      ? new Date(initialData.validUntil).toISOString().slice(0, 10)
      : "",
    status: initialData?.status || "ACTIVE",
    aiProvider: initialData?.aiProvider || "DEFAULT",
    aiApiKey: initialData?.aiApiKey || "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const url = isEditing
        ? `/api/workshops/${initialData.id}`
        : "/api/workshops"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to save workshop")
      }

      router.push(isEditing ? `/admin/workshops/${initialData.id}` : "/admin/workshops")
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Workshop Title</Label>
        <Input
          id="name"
          required
          placeholder="e.g. Full-Stack Web Development Cohort #1"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short Description / Overview</Label>
        <textarea
          id="description"
          rows={3}
          className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="A brief summary of goals and target audience..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="flex items-center gap-1.5">
            <Key className="w-4 h-4 text-gray-500" />
            Invite Code (Optional)
          </Label>
          <Input
            id="code"
            placeholder="Auto-generated if left blank (e.g. WEB2026)"
            className="uppercase font-mono tracking-wider"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          />
          <p className="text-[11px] text-gray-400">Students enter this 6-character code to join.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="validUntil" className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-500" />
            Validity Expiry Date
          </Label>
          <Input
            id="validUntil"
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
          />
          <p className="text-[11px] text-gray-400">After this date, the workshop enters Read-Only mode.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
        <div className="space-y-2">
          <Label htmlFor="aiProvider">AI Provider for Automated Evaluation</Label>
          <select
            id="aiProvider"
            className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={formData.aiProvider}
            onChange={(e) => setFormData({ ...formData, aiProvider: e.target.value })}
          >
            <option value="DEFAULT">Select Provider...</option>
            <option value="GROQ">Groq (Llama-3.3-70B - Ultra Fast)</option>
            <option value="QWEN">Qwen 2.5 (Alibaba / Together AI)</option>
            <option value="GEMINI">Google Gemini Pro 1.5</option>
            <option value="OPENAI">OpenAI GPT-4o</option>
            <option value="CLAUDE">Anthropic Claude 3.5 Sonnet</option>
            <option value="KIMI">Moonshot Kimi K3</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiApiKey">AI Provider API Key (BYOK)</Label>
          <Input
            id="aiApiKey"
            type="password"
            placeholder="e.g. gsk_... or AIza... or sk-..."
            value={formData.aiApiKey}
            onChange={(e) => setFormData({ ...formData, aiApiKey: e.target.value })}
          />
          <p className="text-[11px] text-gray-400">Enables AI grading assistance for assignments in this workshop.</p>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <Label htmlFor="status">Workshop Status</Label>
          <select
            id="status"
            className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="ACTIVE">Active (Accepting Submissions & Enrollees)</option>
            <option value="COMPLETED">Completed (Concluded — Read-Only Mode)</option>
            <option value="ARCHIVED">Archived (Hidden from Active Lists)</option>
          </select>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/workshops")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isEditing ? "Update Workshop" : "Create Workshop Cohort"}
        </Button>
      </div>
    </form>
  )
}
