import {auth} from "@/auth"
import {redirect} from "next/navigation"

export default async function StudentRedirectPage(){
    const session = await auth()
    if(!session){
        redirect("/login")
    }

    // no further auth
    redirect("/student/tutorials")
}