import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminRedirectPage(){
    const session = await auth()

    if(!session){
        redirect("/login?error=try_again")
    }

    const role = session.user.role
    const isAdminOrOwner = (role === "ADMIN" || role ==="OWNER")

    if(!isAdminOrOwner){
        redirect("/login?error=not_admin")
    }

    redirect("/admin")
}