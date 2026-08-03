import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { IDS } from "../lib/ids.js";
import {
  CHANNEL_NAMES,
  findChannelByName,
} from "../utils/channels.js";

/** @type {Map<string, Set<string>>} */
const participantsByMessage = new Map();

/**
 * @param {import('discord.js').Guild} guild
 * @param {string} prize
 * @param {number} durationMs
 * @param {import('discord.js').User} host
 */
export async function startGiveaway(guild, prize, durationMs, host) {
  const channel = findChannelByName(guild, CHANNEL_NAMES.giveaways);
  if (!channel?.isTextBased()) {
    throw new Error(`Channel ${CHANNEL_NAMES.giveaways} not found.`);
  }

  const endsAt = Date.now() + durationMs;
  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🎉 FastPromo Giveaway")
    .setDescription(
      `**Prize:** ${prize}\n\nClick **Participate** to enter.\nHosted by <@${host.id}>.`
    )
    .addFields({
      name: "Ends",
      value: `<t:${Math.floor(endsAt / 1000)}:R>`,
      inline: true,
    })
    .setFooter({ text: "✦｜ɢɪᴠᴇᴀᴡᴀʏs-ᴀɴ-ᴇᴠᴇɴᴛs" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.giveawayJoin)
      .setLabel("🎉 Participate")
      .setStyle(ButtonStyle.Primary)
  );

  const message = await channel.send({ embeds: [embed], components: [row] });
  participantsByMessage.set(message.id, new Set());

  setTimeout(async () => {
    try {
      const entries = participantsByMessage.get(message.id) ?? new Set();
      participantsByMessage.delete(message.id);

      const fetched = await channel.messages.fetch(message.id).catch(() => null);
      if (fetched) {
        await fetched.edit({ components: [] }).catch(() => {});
      }

      if (entries.size === 0) {
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xef4444)
              .setTitle("Giveaway ended")
              .setDescription(`No participants for **${prize}**.`),
          ],
        });
        return;
      }

      const pool = [...entries];
      const winnerId = pool[Math.floor(Math.random() * pool.length)];

      await channel.send({
        content: `Congratulations <@${winnerId}>!`,
        embeds: [
          new EmbedBuilder()
            .setColor(0x22c55e)
            .setTitle("🏆 Giveaway Winner")
            .setDescription(
              `<@${winnerId}> won **${prize}**!\nEntries: **${pool.length}**`
            )
            .setTimestamp(),
        ],
      });
    } catch (err) {
      console.error("[giveaway] finalize error:", err);
    }
  }, durationMs);

  return message;
}

/**
 * @param {import('discord.js').Client} client
 */
export function registerGiveawayHandlers(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== IDS.giveawayJoin) return;

    try {
      const set = participantsByMessage.get(interaction.message.id);
      if (!set) {
        await interaction.reply({
          content: "This giveaway is no longer accepting entries.",
          ephemeral: true,
        });
        return;
      }

      if (set.has(interaction.user.id)) {
        set.delete(interaction.user.id);
        await interaction.reply({
          content: "You left the giveaway.",
          ephemeral: true,
        });
        return;
      }

      set.add(interaction.user.id);
      await interaction.reply({
        content: "You're in! Good luck.",
        ephemeral: true,
      });
    } catch (err) {
      console.error("[giveaway]", err);
    }
  });
}
