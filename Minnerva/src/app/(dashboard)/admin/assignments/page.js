"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Eye, Trash2, Calendar, FileText, Loader2, Search, Filter, BookOpen, Layers } from "lucide-react"

import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal"

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCohort, setSelectedCohort] = useState("ALL")

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignments")
      const data = await res.json()
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  // Extract unique cohorts/workshops from assignments list
  const cohorts = useMemo(() => {
    const map = new Map()
    assignments.forEach((a) => {
      if (a.workshop) {
        map.set(a.workshop.id, a.workshop)
      }
    })
    return Array.from(map.values())
  }, [assignments])

  // Filter assignments based on cohort and search string
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // 1. Cohort filter
      if (selectedCohort !== "ALL") {
        if (selectedCohort === "GLOBAL") {
          if (a.workshopId || a.workshop) return false
        } else {
          if (a.workshop?.id !== selectedCohort && a.workshopId !== selectedCohort) return false
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const titleMatch = a.title?.toLowerCase().includes(q)
        const descMatch = a.description?.toLowerCase().includes(q)
        const workshopNameMatch = a.workshop?.name?.toLowerCase().includes(q)
        const workshopCodeMatch = a.workshop?.code?.toLowerCase().includes(q)
        if (!titleMatch && !descMatch && !workshopNameMatch && !workshopCodeMatch) {
          return false
        }
      }

      return true
    })
  }, [assignments, selectedCohort, searchQuery])

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)

    try {
      await fetch(`/api/assignments/${deleteId}`, { method: "DELETE" })
      await fetchAssignments()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-gray-600">Loading assignments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Assignment Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Create, publish, edit, and evaluate student assignments by cohort.</p>
        </div>
        <Link href="/admin/assignments/new">
          <Button className="flex items-center gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            Create Assignment
          </Button>
        </Link>
      </div>

      {/* Filter and Search Controls */}
      {assignments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search assignments or cohort names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            {/* Cohort Filter Dropdown */}
            <div className="flex items-center gap-2 min-w-[240px]">
              <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
              <select
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-800 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Cohorts ({assignments.length})</option>
                {cohorts.map((c) => {
                  const count = assignments.filter((a) => a.workshop?.id === c.id || a.workshopId === c.id).length
                  return (
                    <option key={c.id} value={c.id}>
                      Cohort: {c.name} {c.code ? `(${c.code})` : ""} ({count})
                    </option>
                  )
                })}
                {assignments.some((a) => !a.workshopId && !a.workshop) && (
                  <option value="GLOBAL">Global / Unassigned Assignments</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>Filter by cohort or search term to manage assignments</span>
            <span>Showing {filteredAssignments.length} of {assignments.length} assignments</span>
          </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No assignments created yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Get started by creating your first course assignment.</p>
          <Link href="/admin/assignments/new">
            <Button variant="outline">Create New Assignment</Button>
          </Link>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800">No matching assignments found</h3>
          <p className="text-xs text-gray-500 mt-1">Try selecting a different cohort or clearing your search term.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredAssignments.map((assignment) => {
              const cohortName = assignment.workshop?.name
              const cohortCode = assignment.workshop?.code

              return (
                <div key={assignment.id} className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {cohortName ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          <BookOpen className="w-3 h-3 text-purple-600" />
                          Cohort: {cohortName} {cohortCode ? `(${cohortCode})` : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          <Layers className="w-3 h-3" />
                          General Assignment
                        </span>
                      )}

                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                          assignment.published
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {assignment.published ? "Published" : "Draft"}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-base truncate">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{assignment.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No deadline"}
                      </span>
                      <span>Max Marks: {assignment.maxMarks}</span>
                      <span>Submissions: {assignment._count?.submissions || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/assignments/${assignment.id}/submissions`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Submissions
                      </Button>
                    </Link>
                    <Link href={`/admin/assignments/${assignment.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteId(assignment.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Are you sure?"
        description="Are you sure you want to delete this assignment? This action cannot be undone."
      />
    </div>
  )
}
