import express from "express";
import { EmbedBuilder } from "discord.js";
import {
  CHANNEL_NAMES,
  findChannelByName,
} from "../utils/channels.js";
import { sanitizePlayerId } from "../utils/sanitize.js";

/**
 * @param {import('discord.js').Client} client
 * @param {{ guildId: string, adminRoleId: string | null, port: number, internalWebhookSecret: string | null }} opts
 */
export function startExpressServer(client, opts) {
  const app = express();
  app.use(express.json({ limit: "256kb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "fastpromo-discord-bot" });
  });

  app.post("/api/webhooks/stripe-moogold", async (req, res) => {
    try {
      if (opts.internalWebhookSecret) {
        const header = req.get("x-fastpromo-secret") || "";
        if (header !== opts.internalWebhookSecret) {
          return res.status(401).json({ ok: false, error: "Unauthorized." });
        }
      }

      const body = req.body && typeof req.body === "object" ? req.body : {};
      const event = String(body.event || body.type || "").toLowerCase();

      const guild = await client.guilds.fetch(opts.guildId);
      await guild.channels.fetch();
      const logs = findChannelByName(guild, CHANNEL_NAMES.logs);

      if (!logs?.isTextBased()) {
        return res.status(500).json({
          ok: false,
          error: "Logs channel not found.",
        });
      }

      if (
        event === "payment.initiated" ||
        event === "payment_intent.created" ||
        event === "checkout.created"
      ) {
        const who =
          sanitizeLabel(body.discordUser) ||
          sanitizeLabel(body.email) ||
          "Unknown user";
        const embed = new EmbedBuilder()
          .setColor(0xf59e0b)
          .setTitle("⏳ Payment initiated")
          .setDescription(`Payment initiated by **${who}**.`)
          .addFields(optionalFields(body))
          .setTimestamp();
        await logs.send({ embeds: [embed] });
        return res.json({ ok: true });
      }

      if (
        event === "payment.success" ||
        event === "checkout.session.completed" ||
        event === "fulfillment.success"
      ) {
        const userId = sanitizePlayerId(String(body.userId || ""));
        const zoneId = sanitizePlayerId(String(body.zoneId || ""));
        const embed = new EmbedBuilder()
          .setColor(0x22c55e)
          .setTitle("✅ Top-up injected")
          .setDescription(
            userId && zoneId
              ? `Order successfully injected into UserID: **${userId}** (Zone **${zoneId}**)`
              : "Order successfully fulfilled via MooGold."
          )
          .addFields(optionalFields(body))
          .setTimestamp();
        await logs.send({ embeds: [embed] });
        return res.json({ ok: true });
      }

      if (
        event === "payment.failed" ||
        event === "fulfillment.failed" ||
        event === "error"
      ) {
        const detail =
          typeof body.error === "string"
            ? body.error
            : typeof body.message === "string"
              ? body.message
              : "Unknown fulfillment error";

        const embed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle("🔴 Fulfillment / payment error")
          .setDescription("Automated pipeline reported a failure.")
          .addFields(
            {
              name: "Diagnostics",
              value: `\`\`\`\n${String(detail).slice(0, 900)}\n\`\`\``,
            },
            ...optionalFields(body)
          )
          .setTimestamp();

        await logs.send({
          content: opts.adminRoleId
            ? `<@&${opts.adminRoleId}> immediate attention required`
            : "🚨 Admin alert",
          embeds: [embed],
        });
        return res.json({ ok: true });
      }

      return res.status(400).json({
        ok: false,
        error:
          "Unrecognized event. Use payment.initiated | payment.success | payment.failed (or aliases).",
      });
    } catch (err) {
      console.error("[express webhook]", err);
      return res.status(500).json({ ok: false, error: "Internal error." });
    }
  });

  const server = app.listen(opts.port, "0.0.0.0", () => {
    console.log(`🌐 Express webhook listener on 0.0.0.0:${opts.port}`);
  });

  return server;
}

/**
 * @param {unknown} value
 */
function sanitizeLabel(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^\w@.\-#\s]/g, "").trim();
  return cleaned.slice(0, 80) || null;
}

/**
 * @param {Record<string, unknown>} body
 */
function optionalFields(body) {
  /** @type {Array<{ name: string, value: string, inline?: boolean }>} */
  const fields = [];
  if (typeof body.sessionId === "string") {
    fields.push({
      name: "Session",
      value: `\`${body.sessionId.slice(0, 80)}\``,
      inline: false,
    });
  }
  if (typeof body.productId === "string") {
    fields.push({
      name: "Product",
      value: `\`${body.productId}\``,
      inline: true,
    });
  }
  const userId = sanitizePlayerId(String(body.userId || ""));
  const zoneId = sanitizePlayerId(String(body.zoneId || ""));
  if (userId) {
    fields.push({ name: "User ID", value: `\`${userId}\``, inline: true });
  }
  if (zoneId) {
    fields.push({ name: "Zone ID", value: `\`${zoneId}\``, inline: true });
  }
  return fields;
}
