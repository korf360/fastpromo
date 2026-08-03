import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { loadEnv } from "./env.js";
import { registerBroadcastHandlers, setupGuild } from "./setupGuild.js";
import { registerTicketHandlers } from "./features/tickets.js";
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

  client.once("ready", async () => {
    console.log(`🤖 FastPromo bot online as ${client.user?.tag}`);
    console.log(`📍 Target guild: ${env.guildId}`);

    try {
      await registerSlashCommands(env.clientId, env.token);
    } catch (err) {
      console.error("❌ Slash command registration failed:", err);
    }

    const shouldBootstrap = process.env.DISCORD_AUTO_SETUP === "true";
    if (shouldBootstrap) {
      try {
        await setupGuild(client, env.guildId);
      } catch (err) {
        console.error("❌ Auto-setup failed:", err);
      }
    }

    startStatusMonitor(client, env.guildId, env.adminRoleId);
    startExpressServer(client, {
      guildId: env.guildId,
      adminRoleId: env.adminRoleId,
      port: env.port,
      internalWebhookSecret: env.internalWebhookSecret,
    });
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
