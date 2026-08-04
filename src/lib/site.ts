export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://fastpromo-eta.vercel.app"
  );
}

export const DISCORD_SUPPORT_URL = "https://discord.gg/fastpromo";
