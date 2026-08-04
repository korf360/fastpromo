import { loadEnv } from "./env.js";
import { registerSlashCommands } from "./features/commands.js";

async function main() {
  try {
    const env = loadEnv();
    await registerSlashCommands(env.clientId, env.token, env.guildId);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
