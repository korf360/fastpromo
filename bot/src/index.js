import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { loadEnv } from "./env.js";
import { registerBroadcastHandlers, setupGuild } from "./setupGuild.js";
import { registerTicketHandlers, deployTicketPanel } from "./features/tickets.js";
import { registerRankHandlers } from "./features/ranks.js";
import {
  registerCommandHandlers,
  registerSlashCommands,
} from "./features/commands.js";
import { registerGiveawayHandlers } from "./features/giveaway.js";
import { startStatusMonitor } from "./features/status.js";
import { startExpressServer } from "./express/server.js";

async function main() {
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    console.error(`❌ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
    partials: [Partials.Channel],
  });

  registerBroadcastHandlers(client);
  registerTicketHandlers(client, env.adminRoleId);
  registerRankHandlers(client);
  registerGiveawayHandlers(client);
  registerCommandHandlers(client, {
    siteUrl: env.siteUrl,
    guildId: env.guildId,
  });

  // Listen for Railway healthchecks before Discord "ready" (login can take seconds).
  startExpressServer(client, {
    guildId: env.guildId,
    adminRoleId: env.adminRoleId,
    port: env.port,
    internalWebhookSecret: env.internalWebhookSecret,
  });

  client.once("ready", async () => {
    console.log(`🤖 FastPromo bot online as ${client.user?.tag}`);
    console.log(`📍 Target guild: ${env.guildId}`);
    console.log(`🌐 Shop URL: ${env.siteUrl}`);

    try {
      await registerSlashCommands(env.clientId, env.token, env.guildId);
    } catch (err) {
      console.error("❌ Slash command registration failed:", err);
    }

    startStatusMonitor(client, env.guildId, env.adminRoleId);

    // Non-blocking guild panel refresh
    void (async () => {
      try {
        const guild = await client.guilds.fetch(env.guildId);
        await guild.channels.fetch();
        await deployTicketPanel(guild);
      } catch (err) {
        console.warn("⚠ Could not refresh ticket panel:", err);
      }

      if (process.env.DISCORD_AUTO_SETUP === "true") {
        try {
          await setupGuild(client, env.guildId);
        } catch (err) {
          console.error("❌ Auto-setup failed:", err);
        }
      }
    })();
  });

  client.on("error", (err) => {
    console.error("[client] error:", err);
  });

  try {
    await client.login(env.token);
  } catch (err) {
    console.error("❌ Failed to login:", err);
    process.exit(1);
  }
}

main();
