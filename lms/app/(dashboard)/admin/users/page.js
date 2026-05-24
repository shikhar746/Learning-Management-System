import { db } from "@/lib/db"

const roleColors = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  STUDENT: "bg-gray-100 text-gray-700",
}

export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">{users.length} total</p>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium">
                  {user.name?.[0] ?? "U"}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                roleColors[user.role] || roleColors.STUDENT
              }`}
            >
              {user.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}