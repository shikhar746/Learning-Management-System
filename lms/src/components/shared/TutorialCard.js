import Link from "next/link"

const difficultyConfig = {
  beginner: { label: "Beginner", className: "bg-green-100 text-green-800" },
  intermediate: { label: "Intermediate", className: "bg-yellow-100 text-yellow-800" },
  advanced: { label: "Advanced", className: "bg-red-100 text-red-800" },
}

export default function TutorialCard({ tutorial }) {
  const difficulty = difficultyConfig[tutorial.difficulty] || difficultyConfig.beginner

  return (
    <Link href={`/student/tutorials/${tutorial.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${difficulty.className}`}>
              {difficulty.label}
            </span>
            {tutorial.completed && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium">
                ✓ Completed
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{tutorial.title}</h3>
          <p className="text-gray-500 text-sm line-clamp-2">{tutorial.description}</p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>{tutorial.lessonCount} lessons</span>
          <span className="text-blue-600 font-medium hover:underline">Start →</span>
        </div>
      </div>
    </Link>
  )
}
