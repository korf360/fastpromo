import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { resolvePublicShopUrl } from "./utils/shopUrl.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, "bot", ".env") });

/**
 * @returns {{
 *   token: string,
 *   guildId: string,
 *   clientId: string,
 *   adminRoleId: string | null,
 *   siteUrl: string,
 *   stripeSecretKey: string | null,
 *   port: number,
 *   internalWebhookSecret: string | null,
 * }}
 */
export function loadEnv() {
  const token = process.env.DISCORD_TOKEN?.trim();
  const guildId = process.env.GUILD_ID?.trim();
  const clientId = process.env.CLIENT_ID?.trim();

  const missing = [];
  if (!token) missing.push("DISCORD_TOKEN");
  if (!guildId) missing.push("GUILD_ID");
  if (!clientId) missing.push("CLIENT_ID");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}`
    );
  }

  const siteUrl = resolvePublicShopUrl(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
  );

  // Railway injects PORT; BOT_PORT is for local side-by-side with Next.js
  const port = Number(process.env.PORT || process.env.BOT_PORT || 3001);

  return {
    token,
    guildId,
    clientId,
    adminRoleId:
      process.env.DISCORD_ADMIN_ROLE_ID?.trim() ||
      process.env.ADMIN_ROLE_ID?.trim() ||
      null,
    siteUrl,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() || null,
    port: Number.isFinite(port) && port > 0 ? port : 3001,
    internalWebhookSecret:
      process.env.INTERNAL_WEBHOOK_SECRET?.trim() || null,
  };
}
