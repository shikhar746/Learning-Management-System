"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Send, ShieldAlert, CheckCircle, Loader2 } from "lucide-react"

export default function ForumThread({ topic, onPostAdded }) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePostSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          content: content.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to post message")
      }

      setContent("")
      if (onPostAdded) onPostAdded(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>Forum Discussion</span>
          {topic.assignment && (
            <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md">
              Task: {topic.assignment.title}
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{topic.title}</h2>
        {topic.description && (
          <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
        )}
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {!topic.posts || topic.posts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No discussion posts yet. Start the conversation!
          </div>
        ) : (
          topic.posts.map((post) => (
            <div
              key={post.id}
              className={`p-4 rounded-xl border transition-colors ${
                post.moderationStatus === "FLAGGED"
                  ? "bg-red-50 border-red-200"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                    {post.user?.name?.[0] || "U"}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900">
                      {post.user?.name || post.user?.email}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-2">
                      {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {post.moderationStatus === "FLAGGED" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Flagged by Moderation
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handlePostSubmit} className="flex gap-3 pt-2 border-t border-gray-100">
        <textarea
          rows={2}
          required
          placeholder="Share your thoughts or ask a question..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button type="submit" disabled={loading || !content.trim()} className="self-end">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
          Post
        </Button>
      </form>
    </div>
  )
}
