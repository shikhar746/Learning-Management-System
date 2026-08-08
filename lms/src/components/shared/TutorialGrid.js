import TutorialCard from "@/components/shared/TutorialCard"

export default function TutorialGrid({ tutorials }) {
  if (!tutorials || tutorials.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        No tutorials available yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tutorials.map((tutorial) => (
        <TutorialCard key={tutorial.id} tutorial={tutorial} />
      ))}
    </div>
  )
}
