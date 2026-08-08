"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ForumThread from "@/components/shared/ForumThread"
import { MessageSquare, Plus, ArrowLeft, Loader2, AlertCircle } from "lucide-react"

export default function StudentWorkshopForumPage({ params }) {
  const { id: workshopId } = use(params)
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState("")

  const [newTopic, setNewTopic] = useState({
    title: "",
    description: "",
  })

  const fetchTopics = () => {
    fetch(`/api/forum/topics?workshopId=${workshopId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.topics) setTopics(data.topics)
      })
      .catch((err) => console.error("Failed to load forum topics:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTopics()
  }, [workshopId])

  const handleSelectTopic = (topicId) => {
    fetch(`/api/forum/topics/${topicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setSelectedTopic(data)
      })
      .catch((err) => console.error("Failed to load topic details:", err))
  }

  const handleCreateTopic = async (e) => {
    e.preventDefault()
    if (!newTopic.title.trim()) return

    setCreateLoading(true)
    setError("")

    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          title: newTopic.title.trim(),
          description: newTopic.description.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create topic")
      }

      setNewTopic({ title: "", description: "" })
      setShowCreateModal(false)
      fetchTopics()
      handleSelectTopic(data.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreateLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading discussion topics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/student/workshops">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Workshops
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Workshop Forum & Discussion
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Ask questions, share insights, and discuss tasks with fellow cohort members.
            </p>
          </div>
        </div>

        <Button onClick={() => setShowCreateModal(!showCreateModal)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ask / Start Topic
        </Button>
      </div>

      {showCreateModal && (
        <form onSubmit={handleCreateTopic} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-xl">
          <h3 className="font-bold text-gray-900 text-sm">Start New Discussion Thread</h3>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">Question / Topic Title</Label>
            <Input
              id="title"
              required
              placeholder="e.g. Help with Task 2 Deployment URL"
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs">Description (Optional)</Label>
            <textarea
              id="description"
              rows={2}
              placeholder="Describe your issue or what you'd like to discuss..."
              value={newTopic.description}
              onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createLoading}>
              {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Publish Question
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topic List */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Discussion Topics ({topics.length})
          </h3>

          {topics.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              No topics created yet. Click "Ask / Start Topic" to ask a question.
            </div>
          ) : (
            <div className="space-y-2">
              {topics.map((t) => {
                const isSelected = selectedTopic?.id === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTopic(t.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 text-blue-900"
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <h4 className="font-semibold text-xs line-clamp-1">{t.title}</h4>
                    {t.description && (
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{t.description}</p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                      <span>{t.createdBy?.name || "Participant"}</span>
                      <span>{t._count?.posts ?? 0} replies</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Topic Thread Discussion Viewer */}
        <div className="lg:col-span-2">
          {selectedTopic ? (
            <ForumThread
              topic={selectedTopic}
              onPostAdded={() => handleSelectTopic(selectedTopic.id)}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-16 text-center space-y-2 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-semibold">Select a topic thread to read and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
