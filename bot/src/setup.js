import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { loadEnv } from "./env.js";
import { setupGuild } from "./setupGuild.js";

async function main() {
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    console.error(`❌ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel],
  });

  try {
    await client.login(env.token);
    await new Promise((resolve, reject) => {
      client.once("ready", resolve);
      client.once("error", reject);
    });

    console.log(`🤖 Logged in as ${client.user?.tag}`);
    await setupGuild(client, env.guildId);
  } catch (err) {
    console.error("❌ Guild setup failed:", err);
    process.exitCode = 1;
  } finally {
    client.destroy();
  }
}

main();
