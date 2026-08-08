"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Calendar, FileText, CheckCircle2, Clock, Loader2, ArrowRight, Search, Filter, BookOpen, Layers, Award } from "lucide-react"
import { fetcher, cacheKeys } from "@/lib/swr"
import { Input } from "@/components/ui/input"

export default function StudentAssignmentsPage() {
  const { data: assignments, isLoading: loadingAssignments } = useSWR(
    cacheKeys.assignments(),
    fetcher,
    { dedupingInterval: 10000 }
  )

  const { data: submissions, isLoading: loadingSubmissions } = useSWR(
    cacheKeys.submissions(),
    fetcher,
    { dedupingInterval: 10000 }
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCohort, setSelectedCohort] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const loading = loadingAssignments || loadingSubmissions
  const rawAssignments = Array.isArray(assignments) ? assignments : []
  const submissionList = Array.isArray(submissions) ? submissions : []

  // Extract unique cohorts/workshops from assignments list
  const cohorts = useMemo(() => {
    const map = new Map()
    rawAssignments.forEach((a) => {
      if (a.workshop) {
        map.set(a.workshop.id, a.workshop)
      }
    })
    return Array.from(map.values())
  }, [rawAssignments])

  // Filter assignments based on cohort, search string, and status
  const filteredAssignments = useMemo(() => {
    return rawAssignments.filter((a) => {
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

      // 3. Status filter
      if (statusFilter !== "ALL") {
        const userSub = submissionList.find((s) => s.assignmentId === a.id)
        if (statusFilter === "PENDING" && userSub) return false
        if (statusFilter === "SUBMITTED" && (!userSub || userSub.isGradePublished)) return false
        if (statusFilter === "GRADED" && (!userSub || !userSub.isGradePublished)) return false
      }

      return true
    })
  }, [rawAssignments, submissionList, selectedCohort, searchQuery, statusFilter])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading your coursework assignments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Your Assignments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse assignments by cohort, review problem requirements, and track your evaluation status.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-3.5 py-1.5 rounded-lg text-xs text-blue-800 dark:text-blue-300 font-semibold self-start sm:self-auto">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>{rawAssignments.length} Total Assignments</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search assignments or cohort names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:bg-white"
            />
          </div>

          {/* Cohort Filter Dropdown */}
          <div className="flex items-center gap-2 min-w-[240px]">
            <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Cohorts ({rawAssignments.length})</option>
              {cohorts.map((c) => {
                const count = rawAssignments.filter((a) => a.workshop?.id === c.id || a.workshopId === c.id).length
                return (
                  <option key={c.id} value={c.id}>
                    Cohort: {c.name} {c.code ? `(${c.code})` : ""} ({count})
                  </option>
                )
              })}
              {rawAssignments.some((a) => !a.workshopId && !a.workshop) && (
                <option value="GLOBAL">Global / Unassigned Assignments</option>
              )}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/60 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-medium mr-1">Status:</span>
            {[
              { id: "ALL", label: "All Statuses" },
              { id: "PENDING", label: "Pending" },
              { id: "SUBMITTED", label: "Submitted" },
              { id: "GRADED", label: "Graded" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-gray-400 font-medium">
            Showing {filteredAssignments.length} of {rawAssignments.length} assignments
          </span>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">No matching assignments found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Try adjusting your cohort filter or search query to find your coursework.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const userSub = submissionList.find((s) => s.assignmentId === assignment.id)
            const cohortName = assignment.workshop?.name
            const cohortCode = assignment.workshop?.code

            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Cohort & Details Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {cohortName ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <BookOpen className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        Cohort: {cohortName} {cohortCode ? `(${cohortCode})` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        <Layers className="w-3 h-3" />
                        General Assignment
                      </span>
                    )}

                    {assignment.requireDocumentation && (
                      <span className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                        Doc Required
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">
                      {assignment.title}
                    </h3>
                    {assignment.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                        {assignment.description}
                      </p>
                    )}
                  </div>

                  {/* Due Date & Max Marks */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No deadline"}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Max Marks: {assignment.maxMarks} pts
                    </span>
                  </div>
                </div>

                {/* Right Side Status & Actions */}
                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                  {userSub ? (
                    userSub.isGradePublished && userSub.totalScore !== null ? (
                      <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        Score: {userSub.totalScore} / {assignment.maxMarks}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Submitted (v{userSub.version})
                      </span>
                    )
                  ) : (
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Needs Submission
                    </span>
                  )}

                  <Link
                    href={`/student/assignments/${assignment.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                  >
                    {userSub ? "View / Resubmit" : "Open Assignment"}
                    <ArrowRight className="w-3.5 h-3.5" />
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