import { auth } from "@/auth";

/** Hardcoded primary owner — always treated as admin (password or Google). */
export const PRIMARY_ADMIN_EMAIL = "korf360@gmail.com";

export function getAdminEmails(): string[] {
  const fromEnv =
    process.env.ADMIN_EMAILS?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? [];

  return Array.from(new Set([PRIMARY_ADMIN_EMAIL, ...fromEnv]));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase().trim());
}

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    return null;
  }
  return session;
}
