"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CreateTutorialForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    difficulty: "beginner",
    videoUrl: "",
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/tutorials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Something went wrong")
      }

      router.push("/admin/tutorials")
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Introduction to JavaScript"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Short description of the tutorial"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="difficulty">Difficulty</Label>
        <select
          id="difficulty"
          name="difficulty"
          value={form.difficulty}
          onChange={handleChange}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div>
        <Label htmlFor="videoUrl">Video URL (optional)</Label>
        <Input
          id="videoUrl"
          name="videoUrl"
          value={form.videoUrl}
          onChange={handleChange}
          placeholder="https://youtube.com/..."
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="content">Content (Markdown)</Label>
        <textarea
          id="content"
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="Write your tutorial content in markdown..."
          required
          rows={8}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono resize-y"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Tutorial"}
      </Button>
    </form>
  )
}