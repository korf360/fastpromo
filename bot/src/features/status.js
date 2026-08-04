import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EmbedBuilder } from "discord.js";
import { pingMoogoldHealth } from "../lib/moogold.js";
import {
  CHANNEL_NAMES,
  findChannelByName,
} from "../utils/channels.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.resolve(__dirname, "../../data/status-message.json");

/** Temporarily off (MooGold creds not set). Flip to true when user asks to restore alerts. */
const ALERT_SUPPLIER_HEALTH_FAILURES = false;

/**
 * @typedef {{ guildId: string, channelId: string, messageId: string, apiStatus?: string, gameStatus?: string }} StatusState
 */

/**
 * @returns {Promise<StatusState | null>}
 */
async function readState() {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {StatusState} state
 */
async function writeState(state) {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

/**
 * @param {'ONLINE' | 'MAINTENANCE'} apiStatus
 * @param {'ONLINE' | 'MAINTENANCE'} gameStatus
 */
export function buildStatusEmbed(apiStatus, gameStatus) {
  const apiOnline = apiStatus === "ONLINE";
  const gameOnline = gameStatus === "ONLINE";
  const allOnline = apiOnline && gameOnline;

  return new EmbedBuilder()
    .setColor(allOnline ? 0x22c55e : 0xef4444)
    .setTitle("FastPromo · Live Status")
    .setDescription(
      allOnline
        ? "All systems operational. Top-ups are processing normally."
        : "Some services are degraded or under maintenance. Delivery may be delayed."
    )
    .addFields(
      {
        name: "Supplier API (MooGold)",
        value: apiOnline ? "ONLINE 🟢" : "MAINTENANCE / OUT OF STOCK 🔴",
        inline: true,
      },
      {
        name: "Game Delivery",
        value: gameOnline ? "ONLINE 🟢" : "MAINTENANCE 🔴",
        inline: true,
      }
    )
    .setFooter({ text: "✦｜sᴇʀᴠᴇʀ-sᴛᴀᴛᴜs · auto-refreshed" })
    .setTimestamp();
}

/**
 * Create or update the permanent status embed.
 * @param {import('discord.js').Guild} guild
 * @param {'ONLINE' | 'MAINTENANCE'} apiStatus
 * @param {'ONLINE' | 'MAINTENANCE'} gameStatus
 */
export async function upsertStatusEmbed(guild, apiStatus, gameStatus) {
  const channel = findChannelByName(guild, CHANNEL_NAMES.serverStatus);
  if (!channel?.isTextBased()) {
    throw new Error(`Channel ${CHANNEL_NAMES.serverStatus} not found.`);
  }

  const embed = buildStatusEmbed(apiStatus, gameStatus);
  const state = await readState();

  if (state?.messageId && state.channelId === channel.id) {
    try {
      const msg = await channel.messages.fetch(state.messageId);
      await msg.edit({ embeds: [embed] });
      await writeState({
        guildId: guild.id,
        channelId: channel.id,
        messageId: msg.id,
        apiStatus,
        gameStatus,
      });
      return msg;
    } catch {
      // fall through to send new
    }
  }

  const sent = await channel.send({ embeds: [embed] });
  await writeState({
    guildId: guild.id,
    channelId: channel.id,
    messageId: sent.id,
    apiStatus,
    gameStatus,
  });
  return sent;
}

/**
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @param {string | null} adminRoleId
 */
export function startStatusMonitor(client, guildId, adminRoleId) {
  const INTERVAL_MS = 10 * 60 * 1000;

  const run = async () => {
    try {
      const guild = await client.guilds.fetch(guildId);
      await guild.channels.fetch();

      const health = await pingMoogoldHealth();
      const prev = await readState();
      const apiStatus = health.ok ? "ONLINE" : "MAINTENANCE";
      const gameStatus =
        prev?.gameStatus === "MAINTENANCE" ? "MAINTENANCE" : "ONLINE";

      await upsertStatusEmbed(guild, apiStatus, gameStatus);

      if (!health.ok && ALERT_SUPPLIER_HEALTH_FAILURES) {
        const logs = findChannelByName(guild, CHANNEL_NAMES.logs);
        if (logs?.isTextBased()) {
          const alert = new EmbedBuilder()
            .setColor(0xef4444)
            .setTitle("🔴 Supplier health check failed")
            .setDescription(
              "MooGold ping failed or reported stock/balance issues."
            )
            .addFields({
              name: "Detail",
              value: `\`\`\`\n${health.detail.slice(0, 900)}\n\`\`\``,
            })
            .setTimestamp();

          await logs.send({
            content: adminRoleId
              ? `<@&${adminRoleId}> urgent supplier alert`
              : "🚨 Admin alert — supplier issue",
            embeds: [alert],
          });
        }
      }
    } catch (err) {
      console.error("[status-monitor]", err);
    }
  };

  // Initial delay so ready handlers finish first
  setTimeout(run, 15_000);
  setInterval(run, INTERVAL_MS);
  console.log("⏱️  MooGold health monitor scheduled every 10 minutes.");
}
