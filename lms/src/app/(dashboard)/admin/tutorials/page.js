import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminTutorialsPage() {
  const tutorials = await db.tutorial.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tutorials</h1>
          <p className="text-gray-500 mt-1">{tutorials.length} total</p>
        </div>
        <Link href="/admin/tutorials/new">
          <Button>+ New Tutorial</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {tutorials.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No tutorials yet. Create your first one!
          </div>
        ) : (
          tutorials.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-gray-900">{t.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>
                <span className="text-xs text-gray-400 capitalize mt-1 inline-block">
                  {t.difficulty} ·{" "}
                  {t.published ? "Published" : "Draft"}
                </span>
              </div>
              <Link href={`/admin/tutorials/${t.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}