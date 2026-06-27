import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

let adapter
try {
  adapter = PrismaAdapter(db)
} catch (e) {
  console.error("ADAPTER ERROR:", e.message)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  // Explicit JWT sessions: session state is carried entirely inside the
  // signed cookie. The PrismaAdapter is still used for the Account model
  // (so repeated Google sign-ins resolve to the same User row), but the
  // adapter's Session table is not read on every request the way it would
  // be under the "database" strategy.
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Runs on every request that touches the token. `user` is only
    // populated on the initial sign-in — every subsequent call only has
    // `token`, so role/id must be copied onto the token once here and
    // read back from the token afterwards (see session() below).
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    // Under the JWT strategy, `user` is NOT passed to this callback after
    // the first sign-in — only `token` is reliable. Reading from `user`
    // here (as the previous database-session-era code did) would leave
    // session.user.role permanently undefined on every request after
    // the first.
    session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
})