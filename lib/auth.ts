import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { username?: string }).username = token.username as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "닉네임", type: "text" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        if (!username || username.trim().length < 2) return null;

        let user = await prisma.user.findUnique({
          where: { username: username.trim() },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              username: username.trim(),
              character: { create: {} },
              room: { create: {} },
            },
          });
        }

        return { id: user.id, name: user.username, username: user.username };
      },
    }),
  ],
});
