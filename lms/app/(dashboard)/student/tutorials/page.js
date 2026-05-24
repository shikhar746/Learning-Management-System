import { db } from "@/lib/db"
import { auth } from "@/auth"
import TutorialGrid from "@/components/dashboard/TutorialGrid"

export default async function TutorialsPage() {
  const session = await auth()

  const tutorials = await db.tutorial.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  })

  const progress = await db.progress.findMany({
    where: { userId: session.user.id },
  })

  const completedIds = new Set(
    progress.filter((p) => p.completed).map((p) => p.tutorialId)
  )

  const tutorialsWithProgress = tutorials.map((t) => ({
    ...t,
    lessonCount: 5,
    completed: completedIds.has(t.id),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tutorials</h1>
        <p className="text-gray-500 mt-1">
          {completedIds.size} of {tutorials.length} completed
        </p>
      </div>
      <TutorialGrid tutorials={tutorialsWithProgress} />
    </div>
  )
}