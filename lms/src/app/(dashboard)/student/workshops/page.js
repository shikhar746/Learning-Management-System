"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import JoinWorkshopModal from "@/components/student/JoinWorkshopModal"
import { Key, BookOpen, Clock, Loader2, ShieldCheck, ArrowRight } from "lucide-react"

export default function StudentWorkshopsPage() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)

  const fetchWorkshops = () => {
    fetch("/api/workshops")
      .then((res) => res.json())
      .then((data) => {
        if (data.workshops) setWorkshops(data.workshops)
      })
      .catch((err) => console.error("Failed to load enrolled workshops:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchWorkshops()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading your workshop cohorts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrolled Workshops</h1>
          <p className="text-sm text-gray-500 mt-1">
            Access your active workshop cohorts, tasks, and discussion forums.
          </p>
        </div>
        <Button onClick={() => setShowJoinModal(!showJoinModal)} className="flex items-center gap-2">
          <Key className="w-4 h-4" /> Join via Code
        </Button>
      </div>

      {showJoinModal && (
        <div className="max-w-md mx-auto py-2">
          <JoinWorkshopModal onJoined={() => {
            setShowJoinModal(false)
            fetchWorkshops()
          }} />
        </div>
      )}

      {workshops.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center space-y-3">
          <Key className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-semibold text-gray-800">No Workshops Enrolled Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Click "Join via Code" and enter the 6-character invite code provided by your instructor to join a cohort.
          </p>
          <Button size="sm" onClick={() => setShowJoinModal(true)} className="mt-2">
            Enter Join Code
          </Button>
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
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {isClosed ? "Read-Only (Concluded)" : "Enrolled"}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      Code: {w.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-1">{w.name}</h3>
                  {w.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{w.description}</p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      {w.assignmentCount ?? 0} Tasks
                    </span>
                    {w.validUntil && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Expires {new Date(w.validUntil).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <Link href={`/student/assignments`} className="block pt-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View Tasks & Forum <ArrowRight className="w-3 h-3 ml-1" />
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
