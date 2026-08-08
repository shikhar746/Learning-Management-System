"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Key, Users, BookOpen, Clock, Loader2, ShieldCheck, Copy, Check } from "lucide-react"

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetch("/api/workshops")
      .then((res) => res.json())
      .then((data) => {
        if (data.workshops) setWorkshops(data.workshops)
      })
      .catch((err) => console.error("Failed to load workshops:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading workshop cohorts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workshop Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and oversee multi-tenant workshop cohorts, invite codes, and student enrollees.
          </p>
        </div>
        <Link href="/admin/workshops/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Workshop
          </Button>
        </Link>
      </div>

      {workshops.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-semibold text-gray-800">No Workshops Created Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Click "+ Create Workshop" to set up your first cohort, generate invite codes, and assign instructors.
          </p>
          <Link href="/admin/workshops/new" className="inline-block pt-2">
            <Button size="sm">+ Create Workshop</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops.map((w) => {
            const isClosed = w.status === "COMPLETED" || (w.validUntil && new Date() > new Date(w.validUntil))
            return (
              <div
                key={w.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        isClosed
                          ? "bg-slate-100 text-slate-800"
                          : w.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {isClosed ? "Read-Only (Concluded)" : w.status}
                    </span>
                    <button
                      onClick={() => handleCopyCode(w.code, w.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono px-2 py-1 rounded flex items-center gap-1 transition-colors"
                      title="Click to copy invite code"
                    >
                      <Key className="w-3 h-3 text-blue-600" />
                      <span>{w.code}</span>
                      {copiedId === w.id ? <Check className="w-3 h-3 text-green-600 ml-1" /> : <Copy className="w-3 h-3 text-gray-400 ml-1" />}
                    </button>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-1">{w.name}</h3>
                  {w.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{w.description}</p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-blue-600 mx-auto mb-0.5" />
                      <span className="font-bold text-gray-800 block">{w.studentCount ?? 0}</span>
                      <span className="text-[10px] text-gray-400">Students</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600 mx-auto mb-0.5" />
                      <span className="font-bold text-gray-800 block">{w.adminCount ?? 1}</span>
                      <span className="text-[10px] text-gray-400">Admins</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <BookOpen className="w-3.5 h-3.5 text-green-600 mx-auto mb-0.5" />
                      <span className="font-bold text-gray-800 block">{w.assignmentCount ?? 0}</span>
                      <span className="text-[10px] text-gray-400">Tasks</span>
                    </div>
                  </div>

                  {w.validUntil && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>Valid until: {new Date(w.validUntil).toLocaleDateString()}</span>
                    </div>
                  )}

                  <Link href={`/admin/workshops/${w.id}`} className="block pt-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Control Room & Management →
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
