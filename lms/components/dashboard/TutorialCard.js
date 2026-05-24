import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
}

export default function TutorialCard({ tutorial }) {
  return (
    <Link href={`/student/tutorials/${tutorial.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 leading-tight">
              {tutorial.title}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                difficultyColors[tutorial.difficulty] ||
                difficultyColors.beginner
              }`}
            >
              {tutorial.difficulty}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {tutorial.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {tutorial.lessonCount} lessons
            </span>
            {tutorial.completed && (
              <span className="text-xs text-green-600 font-medium">
                ✓ Completed
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}