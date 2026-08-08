import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    const role = dbUser?.role || session.user.role
    if (role === "ADMIN" || role === "OWNER") {
      redirect("/admin")
    } else {
      redirect("/student")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Learn to code.
          <br />
          <span className="text-blue-600">Ship real projects.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-8">
          A hands-on coding platform with workshops, assignments, and AI-powered
          code review.
        </p>
        <Link href="/login">
          <Button size="lg" className="px-8">
            Get started for free
          </Button>
        </Link>
      </div>
    </main>
  )
}