import TutorialCard from "./TutorialCard"

export default function TutorialGrid({ tutorials }) {
  if (tutorials.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">No tutorials available yet.</p>
        <p className="text-gray-400 text-sm mt-1">Check back soon!</p>
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