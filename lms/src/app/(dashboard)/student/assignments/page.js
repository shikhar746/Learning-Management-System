import { db } from "@/lib/db"
import { auth } from "@/auth"
import AssignmentList from "@/components/dashboard/AssignmentList"

export default async function AssignmentsPage() {
  const session = await auth()

  const assignments = await db.assignment.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  })

  const submissions = await db.submission.findMany({
    where: { userId: session.user.id },
  })

  const submissionMap = {}
  submissions.forEach((s) => {
    submissionMap[s.assignmentId] = s
  })

  const assignmentsWithStatus = assignments.map((a) => {
    const submission = submissionMap[a.id]
    return {
      ...a,
      dueDate: a.dueDate
        ? new Date(a.dueDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "No due date",
      status: submission
        ? submission.status === "GRADED"
          ? "graded"
          : "submitted"
        : "pending",
      score: submission?.totalScore ?? null,
    }
  })

  const graded = assignmentsWithStatus.filter((a) => a.status === "graded").length
  const pending = assignmentsWithStatus.filter((a) => a.status === "pending").length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Assignments</h1>
        <p className="text-gray-500 mt-1">
          {graded} graded · {pending} pending
        </p>
      </div>
      <AssignmentList assignments={assignmentsWithStatus} />
    </div>
  )
}