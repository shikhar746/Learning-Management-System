"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function JoinWorkshopModal({ onJoined }) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch("/api/workshops/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to join workshop")
      }

      setSuccess(true)
      setCode("")
      if (onJoined) onJoined(data)
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 max-w-md">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          Join Workshop via Code
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Enter the 6-character invite code provided by your instructor to join the workshop.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Enrolled successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="joinCode">Workshop Invite Code</Label>
          <Input
            id="joinCode"
            required
            maxLength={10}
            placeholder="e.g. WEB2026"
            className="uppercase font-mono tracking-widest text-center text-lg py-3"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>

        <Button type="submit" disabled={loading || !code.trim()} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Join Workshop Cohort
        </Button>
      </form>
    </div>
  )
}
