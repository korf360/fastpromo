import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { IDS, RANK_TIERS } from "../lib/ids.js";
import {
  CHANNEL_NAMES,
  findChannelByName,
  messageHasCustomId,
} from "../utils/channels.js";

/**
 * Deploy rank selection embed + select menu.
 * @param {import('discord.js').Guild} guild
 */
export async function deployRankPanel(guild) {
  const channel = findChannelByName(guild, CHANNEL_NAMES.gameRanges);
  if (!channel?.isTextBased()) {
    throw new Error(`Channel ${CHANNEL_NAMES.gameRanges} not found.`);
  }

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("Rank Ranges · FastPromo")
    .setDescription(
      [
        "Select your **current ranked tier** so the community and staff can match you faster.",
        "",
        "**How it works**",
        "• Choose one option from the menu below.",
        "• Selecting again **toggles** that role off.",
        "• Only **one** rank tier role can be active at a time — other tiers are removed automatically.",
        "",
        "**Tiers**",
        "1️⃣ Warrior / Elite / Master",
        "2️⃣ Grandmaster / Epic",
        "3️⃣ Legend",
        "4️⃣ Mythic / Glory / Immortal",
        "",
        "_Pick the highest bracket that matches your current rank._",
      ].join("\n")
    )
    .setFooter({ text: "✦｜ɢᴀᴍᴇ-ʀᴀɴɢᴇs · roles update instantly" });

  const menu = new StringSelectMenuBuilder()
    .setCustomId(IDS.rankSelect)
    .setPlaceholder("Select your rank tier")
    .addOptions(
      RANK_TIERS.map((tier) => ({
        label: tier.label,
        value: tier.value,
        description: tier.description,
      }))
    );

  const row = new ActionRowBuilder().addComponents(menu);
  const payload = { embeds: [embed], components: [row] };

  const messages = await channel.messages.fetch({ limit: 20 });
  const existing = messages.find((m) => messageHasCustomId(m, IDS.rankSelect));
  if (existing) {
    await existing.edit(payload);
    console.log(`  ↪ rank panel updated in ${channel.name}`);
    return existing;
  }

  const sent = await channel.send(payload);
  console.log(`  + rank panel deployed in ${channel.name}`);
  return sent;
}

/**
 * @param {import('discord.js').Client} client
 */
export function registerRankHandlers(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== IDS.rankSelect) return;

    try {
      await handleRankSelect(interaction);
    } catch (err) {
      console.error("[ranks]", err);
      const payload = {
        content: "Could not update your rank role. Please try again.",
        ephemeral: true,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  });
}

/**
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 */
async function handleRankSelect(interaction) {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: "Rank roles are only available in the server.",
      ephemeral: true,
    });
    return;
  }

  const selected = interaction.values[0];
  const tier = RANK_TIERS.find((t) => t.value === selected);
  if (!tier) {
    await interaction.reply({
      content: "Unknown rank selection.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const member = await guild.members.fetch(interaction.user.id);

  /** Ensure all tier roles exist */
  /** @type {Map<string, import('discord.js').Role>} */
  const rolesByValue = new Map();
  for (const t of RANK_TIERS) {
    let role = guild.roles.cache.find((r) => r.name === t.roleName) ?? null;
    if (!role) {
      role = await guild.roles.create({
        name: t.roleName,
        color: t.color,
        mentionable: false,
        hoist: false,
        reason: "FastPromo automated rank role",
      });
    }
    rolesByValue.set(t.value, role);
  }

  const targetRole = rolesByValue.get(tier.value);
  if (!targetRole) {
    await interaction.editReply({ content: "Role could not be resolved." });
    return;
  }

  const hasTarget = member.roles.cache.has(targetRole.id);

  // Remove conflicting tier roles
  const otherRoleIds = RANK_TIERS.filter((t) => t.value !== tier.value)
    .map((t) => rolesByValue.get(t.value)?.id)
    .filter(Boolean);

  if (otherRoleIds.length) {
    await member.roles.remove(otherRoleIds, "Rank tier exclusivity");
  }

  if (hasTarget) {
    await member.roles.remove(targetRole.id, "Rank role toggled off");
    await interaction.editReply({
      content: `Removed **${tier.label}**. You currently have no rank tier role.`,
    });
    return;
  }

  await member.roles.add(targetRole.id, "Rank role assigned");
  await interaction.editReply({
    content: `Updated — you are now **${tier.label}**. Other rank tiers were cleared.`,
  });
}
