"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Users, ShieldCheck, Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Copy, Check, Trash2 } from "lucide-react"

export default function WorkshopControlRoomPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [workshop, setWorkshop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState({ error: "", success: "" })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/workshops/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setWorkshop(data)
      })
      .catch((err) => console.error("Failed to load workshop:", err))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopyCode = () => {
    if (!workshop?.code) return
    navigator.clipboard.writeText(workshop.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInviteAdmin = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviteLoading(true)
    setInviteMsg({ error: "", success: "" })

    try {
      const res = await fetch(`/api/workshops/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to invite admin")
      }

      setInviteMsg({ success: `User ${data.user?.email} added as Admin successfully!`, error: "" })
      setInviteEmail("")
      // Refresh workshop data
      const refreshRes = await fetch(`/api/workshops/${id}`)
      const refreshedData = await refreshRes.json()
      if (!refreshedData.error) setWorkshop(refreshedData)
    } catch (err) {
      setInviteMsg({ error: err.message, success: "" })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleDeleteWorkshop = async () => {
    if (!confirm("Are you sure you want to delete this workshop cohort? This action cannot be undone.")) {
      return
    }

    try {
      const res = await fetch(`/api/workshops/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/admin/workshops")
      }
    } catch (err) {
      alert("Failed to delete workshop")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading workshop control room...</span>
      </div>
    )
  }

  if (!workshop) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Workshop Not Found</h2>
        <Link href="/admin/workshops">
          <Button variant="outline">Back to Workshops</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/workshops">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workshop.name}</h1>
            <p className="text-xs text-gray-500">Workshop Tenant ID: {workshop.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="bg-blue-50 border border-blue-200 text-blue-900 font-mono text-sm px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors"
          >
            <Key className="w-4 h-4 text-blue-600" />
            <span>{workshop.code}</span>
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-blue-400" />}
          </button>

          <Button variant="destructive" size="sm" onClick={handleDeleteWorkshop}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete Cohort
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <Users className="w-4 h-4" /> Enrolled Students
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{workshop.studentCount}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600">
            <ShieldCheck className="w-4 h-4" /> Workshop Instructors
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{workshop.adminCount}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-green-600">
            <Key className="w-4 h-4" /> Invite Code
          </div>
          <p className="text-xl font-bold font-mono text-gray-900 tracking-wider">{workshop.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Admin Invite & Instructors */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              Instructors & Co-Admins
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Invite additional admins by email to help manage tasks, grade work, and moderate discussions.
            </p>
          </div>

          <form onSubmit={handleInviteAdmin} className="space-y-3 bg-purple-50/50 border border-purple-100 rounded-lg p-4">
            <Label htmlFor="inviteEmail" className="text-xs font-semibold text-purple-900">
              Add Admin by Registered Email
            </Label>
            <div className="flex gap-2">
              <Input
                id="inviteEmail"
                type="email"
                required
                placeholder="co-instructor@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-white text-xs"
              />
              <Button type="submit" size="sm" disabled={inviteLoading} className="bg-purple-700 hover:bg-purple-800 shrink-0">
                {inviteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Mail className="w-3.5 h-3.5 mr-1" />}
                Invite
              </Button>
            </div>
            {inviteMsg.error && <p className="text-xs text-red-600">{inviteMsg.error}</p>}
            {inviteMsg.success && <p className="text-xs text-green-600 font-semibold">{inviteMsg.success}</p>}
          </form>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Admins ({workshop.admins.length})</h4>
            <div className="divide-y divide-gray-100">
              {workshop.admins.map((admin) => (
                <div key={admin.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-gray-900">{admin.name || "Instructor"}</p>
                    <p className="text-gray-500">{admin.email}</p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Admin
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Enrolled Students */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Enrolled Students ({workshop.students.length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Students who have joined using code <span className="font-mono font-bold text-blue-700">{workshop.code}</span>.
            </p>
          </div>

          {workshop.students.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No students enrolled yet. Share code <strong className="font-mono text-gray-700">{workshop.code}</strong> to get started.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto pr-1">
              {workshop.students.map((student) => (
                <div key={student.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {student.image ? (
                      <img src={student.image} alt={student.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                        {student.name?.[0] || "S"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{student.name || "Student"}</p>
                      <p className="text-gray-400 text-[11px]">{student.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    Student
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
