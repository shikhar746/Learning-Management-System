"use client"

import { Users, FileText, CheckCircle, Clock, TrendingUp } from "lucide-react"

export default function AnalyticsCards({ data, role = "admin" }) {
  if (!data) return null

  if (role === "admin") {
    return (
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Students</span>
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data.totalStudents || 0}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Assignments</span>
              <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data.totalAssignments || 0}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Evaluation</span>
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data.pendingSubmissionsCount || 0}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submission Rate</span>
              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data.submissionPercentage || 0}%</p>
          </div>
        </div>

        {/* Class Averages Section */}
        {data.classAverages?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Class Average Score per Assignment</h3>
            <div className="space-y-4">
              {data.classAverages.map((item) => {
                const percentage = item.maxMarks > 0 ? (item.averageScore / item.maxMarks) * 100 : 0
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800 truncate">{item.title}</span>
                      <span className="text-gray-500">
                        {item.averageScore} / {item.maxMarks} ({item.gradedCount} graded)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Student Summary
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Tasks</span>
        <p className="text-2xl font-bold text-gray-900 mt-2">{data.submittedCount || 0}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Assignments</span>
        <p className="text-2xl font-bold text-amber-600 mt-2">{data.pendingCount || 0}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall Progress</span>
        <p className="text-2xl font-bold text-blue-600 mt-2">{data.courseProgress || 0}%</p>
      </div>
    </div>
  )
}
