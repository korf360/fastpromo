import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/cashback";
import { isAdminEmail } from "@/lib/admin";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim()
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            // Link Google to an existing email/password account with the same email.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  // Required so Credentials keep working alongside the Prisma adapter / Google.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/account") || path.startsWith("/admin")) {
        return !!session?.user;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.sub = user.id;
      }

      // OAuth first login: adapter user id is on user.id; ensure email is lowercased in DB.
      if (account?.provider === "google" && user?.email && user.id) {
        const email = user.email.toLowerCase().trim();
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email,
            emailVerified: new Date(),
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });
        token.sub = user.id;
        token.email = email;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { cashbackCents: true, email: true, name: true },
        });
        if (dbUser) {
          token.cashbackCents = dbUser.cashbackCents;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.isAdmin = isAdminEmail(dbUser.email);
        } else {
          token.isAdmin = false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.cashbackCents =
          typeof token.cashbackCents === "number" ? token.cashbackCents : 0;
        session.user.isAdmin = token.isAdmin === true;
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});

export const isGoogleAuthEnabled = googleConfigured;
