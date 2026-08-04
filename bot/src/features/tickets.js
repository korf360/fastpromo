import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { IDS } from "../lib/ids.js";
import {
  CHANNEL_NAMES,
  findCategoryByName,
  findChannelByName,
  messageHasCustomId,
} from "../utils/channels.js";
import { randomDigits, sanitizeChannelUsername } from "../utils/sanitize.js";

const F = PermissionsBitField.Flags;

/**
 * Deploy permanent Open Support Ticket panel.
 * @param {import('discord.js').Guild} guild
 */
export async function deployTicketPanel(guild) {
  const channel = findChannelByName(guild, CHANNEL_NAMES.supportTickets);
  if (!channel?.isTextBased()) {
    throw new Error(`Channel ${CHANNEL_NAMES.supportTickets} not found.`);
  }

  const embed = new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle("FastPromo Support")
    .setDescription(
      "Need help with a top-up, payment, or delivery?\n\n" +
        "Click **Open Support Ticket** for a private channel with staff.\n\n" +
        "**Before you write:** copy your **Support ID** from the shop " +
        "(Account → Purchase activity — looks like `FP-2026-ABCD1234`) " +
        "and paste it in the ticket. Staff use `/order` with that ID to review your purchase."
    )
    .setFooter({ text: "✦｜sᴜᴘᴘᴏʀᴛ-ᴛɪᴄᴋᴇᴛs · typically replies within minutes" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.openTicket)
      .setLabel("📩 Open Support Ticket")
      .setStyle(ButtonStyle.Success)
  );

  const messages = await channel.messages.fetch({ limit: 20 });
  const existing = messages.find((m) => messageHasCustomId(m, IDS.openTicket));
  if (existing) {
    await existing.edit({ embeds: [embed], components: [row] });
    console.log(`  ↪ ticket panel updated in ${channel.name}`);
    return existing;
  }

  const sent = await channel.send({ embeds: [embed], components: [row] });
  console.log(`  + ticket panel deployed in ${channel.name}`);
  return sent;
}

/**
 * @param {import('discord.js').Client} client
 * @param {string | null} adminRoleId
 */
export function registerTicketHandlers(client, adminRoleId) {
  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.isButton()) return;

      if (interaction.customId === IDS.openTicket) {
        await handleOpenTicket(interaction, adminRoleId);
        return;
      }

      if (interaction.customId === IDS.closeTicket) {
        await handleCloseTicket(interaction);
      }
    } catch (err) {
      console.error("[tickets]", err);
      const payload = {
        content: "Could not process that ticket action. Please try again.",
        ephemeral: true,
      };
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
    }
  });
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string | null} adminRoleId
 */
async function handleOpenTicket(interaction, adminRoleId) {
  if (!interaction.guild || !interaction.member || !interaction.client.user) {
    await interaction.reply({
      content: "Tickets are only available inside the FastPromo server.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const category = findCategoryByName(
    guild,
    CHANNEL_NAMES.privateSupportCategory
  );
  if (!category) {
    await interaction.editReply({
      content: "Private support category is missing. Run bot setup first.",
    });
    return;
  }

  const member = interaction.member;
  const user = interaction.user;
  const safeName = sanitizeChannelUsername(user.username);
  const channelName = `ticket-${safeName}-${randomDigits()}`.slice(0, 100);

  /** @type {import('discord.js').OverwriteResolvable[]} */
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [F.ViewChannel],
    },
    {
      id: user.id,
      allow: [
        F.ViewChannel,
        F.ReadMessageHistory,
        F.SendMessages,
        F.AttachFiles,
        F.EmbedLinks,
      ],
    },
    {
      id: interaction.client.user.id,
      allow: [
        F.ViewChannel,
        F.ReadMessageHistory,
        F.SendMessages,
        F.ManageChannels,
        F.ManageMessages,
        F.EmbedLinks,
      ],
    },
  ];

  if (adminRoleId) {
    overwrites.push({
      id: adminRoleId,
      allow: [
        F.ViewChannel,
        F.ReadMessageHistory,
        F.SendMessages,
        F.ManageMessages,
        F.AttachFiles,
        F.EmbedLinks,
      ],
    });
  } else {
    for (const role of guild.roles.cache.values()) {
      if (role.permissions.has(PermissionFlagsBits.Administrator)) {
        overwrites.push({
          id: role.id,
          allow: [
            F.ViewChannel,
            F.ReadMessageHistory,
            F.SendMessages,
            F.ManageMessages,
          ],
        });
      }
    }
  }

  const ticket = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: overwrites,
    topic: `Support ticket for ${user.tag} (${user.id})`,
    reason: `Ticket opened by ${user.tag}`,
  });

  const intro = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("Support ticket opened")
    .setDescription(
      `Welcome <@${user.id}>.\n\n` +
        "Please describe your issue and include:\n" +
        "• **Support ID** from the shop — Account → Purchase activity " +
        "(looks like `FP-2026-ABCD1234`). Staff will run `/order` with it.\n" +
        "• In-game **User ID** & **Zone ID**\n" +
        "• Screenshots of the problem\n\n" +
        "Staff will assist you here shortly."
    )
    .setFooter({ text: "FastPromo Support · close when resolved" });

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.closeTicket)
      .setLabel("🔒 Close Ticket")
      .setStyle(ButtonStyle.Danger)
  );

  await ticket.send({
    content: adminRoleId ? `<@&${adminRoleId}>` : undefined,
    embeds: [intro],
    components: [closeRow],
  });

  await interaction.editReply({
    content: `Your private ticket is ready: ${ticket}`,
  });
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleCloseTicket(interaction) {
  if (!interaction.channel || !interaction.guild) return;

  const channel = interaction.channel;
  if (!("name" in channel) || !channel.name.startsWith("ticket-")) {
    await interaction.reply({
      content: "This button only works inside ticket channels.",
      ephemeral: true,
    });
    return;
  }

  const isAdmin =
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    false;
  const isOpener =
    "permissionOverwrites" in channel &&
    channel.permissionOverwrites.cache.has(interaction.user.id);

  if (!isAdmin && !isOpener) {
    await interaction.reply({
      content: "Only the ticket owner or an administrator can close this.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: "Closing ticket in **5 seconds**…",
  });

  setTimeout(async () => {
    try {
      if (channel.deletable) {
        await channel.delete(`Ticket closed by ${interaction.user.tag}`);
      }
    } catch (err) {
      console.error("[tickets] failed to delete channel:", err);
    }
  }, 5000);
}
