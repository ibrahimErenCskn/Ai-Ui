import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export default {
  providers: [GitHub, Google],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return true; // Yetkilendirme kontrolünü middleware'de yapıyoruz
    },
    async session({ session, user, token }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
      } else if (session.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
