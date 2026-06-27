import { redirect } from "next/navigation"

// Registration and login are the same action under Google-only OAuth —
// signing in with Google creates the account on first use. This route is
// kept (rather than deleted) so any existing links to /register don't 404,
// but it has no UI of its own anymore.
export default function RegisterPage() {
  redirect("/login")
}