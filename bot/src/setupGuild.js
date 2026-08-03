import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  CUSTOM_IDS,
  EMBED_PANEL_CHANNEL,
  GUILD_STRUCTURE,
  buildOverwrites,
} from "./structure.js";
import { deployTicketPanel } from "./features/tickets.js";
import { deployRankPanel } from "./features/ranks.js";
import { upsertStatusEmbed } from "./features/status.js";

/**
 * Idempotent guild bootstrap: categories, channels, permissions, embed panel.
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 */
export async function setupGuild(client, guildId) {
  const guild = await client.guilds.fetch(guildId);
  await guild.channels.fetch();
  await guild.roles.fetch();

  const botUser = client.user;
  if (!botUser) throw new Error("Client user is not available.");

  console.log(`\n⚙️  Setting up guild: ${guild.name} (${guild.id})\n`);

  /** @type {Map<string, import('discord.js').CategoryChannel>} */
  const categoriesByName = new Map();

  for (const categoryDef of GUILD_STRUCTURE) {
    const category = await ensureCategory(guild, botUser, categoryDef);
    categoriesByName.set(categoryDef.name, category);

    for (const channelDef of categoryDef.channels) {
      await ensureTextChannel(guild, botUser, category, channelDef);
    }
  }

  const panelChannel = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildText && ch.name === EMBED_PANEL_CHANNEL
  );

  if (!panelChannel || !panelChannel.isTextBased()) {
    throw new Error(
      `Admin panel channel "${EMBED_PANEL_CHANNEL}" was not found after setup.`
    );
  }

  await ensureEmbedPanel(panelChannel);

  try {
    await deployTicketPanel(guild);
  } catch (err) {
    console.error("  ! ticket panel:", err);
  }

  try {
    await deployRankPanel(guild);
  } catch (err) {
    console.error("  ! rank panel:", err);
  }

  try {
    await upsertStatusEmbed(guild, "ONLINE", "ONLINE");
    console.log("  + status board ensured");
  } catch (err) {
    console.error("  ! status board:", err);
  }

  console.log("\n✅ Guild structure ready.\n");
  return { guild, panelChannel };
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').ClientUser} botUser
 * @param {import('./structure.js').CategoryDef} def
 */
async function ensureCategory(guild, botUser, def) {
  const existing = guild.channels.cache.find(
    (ch) => ch.type === ChannelType.GuildCategory && ch.name === def.name
  );

  if (existing) {
    console.log(`  ↪ category exists: ${def.name}`);
    await existing.permissionOverwrites.set(
      buildOverwrites(guild, botUser, def.access)
    );
    return /** @type {import('discord.js').CategoryChannel} */ (existing);
  }

  const created = await guild.channels.create({
    name: def.name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: buildOverwrites(guild, botUser, def.access),
    reason: "FastPromo guild bootstrap",
  });
  console.log(`  + category created: ${def.name}`);
  return created;
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').ClientUser} botUser
 * @param {import('discord.js').CategoryChannel} parent
 * @param {import('./structure.js').ChannelDef} def
 */
async function ensureTextChannel(guild, botUser, parent, def) {
  const existing = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildText &&
      ch.name === def.name &&
      ch.parentId === parent.id
  );

  if (existing) {
    console.log(`    ↪ channel exists: ${def.name}`);
    await existing.permissionOverwrites.set(
      buildOverwrites(guild, botUser, def.access)
    );
    if (existing.parentId !== parent.id) {
      await existing.setParent(parent.id, { lockPermissions: false });
    }
    return existing;
  }

  // Also reuse a same-named text channel elsewhere (move under correct category)
  const orphan = guild.channels.cache.find(
    (ch) => ch.type === ChannelType.GuildText && ch.name === def.name
  );

  if (orphan) {
    console.log(`    ↪ channel moved: ${def.name}`);
    await orphan.setParent(parent.id, { lockPermissions: false });
    await orphan.permissionOverwrites.set(
      buildOverwrites(guild, botUser, def.access)
    );
    return orphan;
  }

  const created = await guild.channels.create({
    name: def.name,
    type: ChannelType.GuildText,
    parent: parent.id,
    permissionOverwrites: buildOverwrites(guild, botUser, def.access),
    reason: "FastPromo guild bootstrap",
  });
  console.log(`    + channel created: ${def.name}`);
  return created;
}

/**
 * Deploy permanent Create Broadcast panel if missing.
 * @param {import('discord.js').GuildTextBasedChannel} channel
 */
export async function ensureEmbedPanel(channel) {
  const messages = await channel.messages.fetch({ limit: 25 });
  const existing = messages.find((msg) =>
    msg.components.some((row) =>
      row.components.some(
        (c) => "customId" in c && c.customId === CUSTOM_IDS.createBroadcast
      )
    )
  );

  if (existing) {
    console.log(`  ↪ embed panel already deployed in ${channel.name}`);
    return existing;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("FastPromo · Embed Broadcast Panel")
    .setDescription(
      "Administrators can push a branded embed into any channel.\n\n" +
        "Click **Create Broadcast**, fill the modal, and the message is injected instantly."
    )
    .setFooter({ text: "✦｜ᴇᴍʙᴇᴅ-ᴘᴀɴᴇʟ · staff only" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.createBroadcast)
      .setLabel("Create Broadcast")
      .setStyle(ButtonStyle.Primary)
  );

  const sent = await channel.send({ embeds: [embed], components: [row] });
  console.log(`  + embed panel deployed in ${channel.name}`);
  return sent;
}

/**
 * Register interaction handlers for the broadcast button + modal.
 * @param {import('discord.js').Client} client
 */
export function registerBroadcastHandlers(client) {
  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isButton() && interaction.customId === CUSTOM_IDS.createBroadcast) {
        await handleBroadcastButton(interaction);
        return;
      }

      if (
        interaction.isModalSubmit() &&
        interaction.customId === CUSTOM_IDS.broadcastModal
      ) {
        await handleBroadcastModal(interaction);
      }
    } catch (err) {
      console.error("[broadcast] interaction error:", err);
      const payload = {
        content: "Something went wrong processing that action.",
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
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleBroadcastButton(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "Only Administrators can create broadcasts.",
      ephemeral: true,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(CUSTOM_IDS.broadcastModal)
    .setTitle("Create Broadcast Embed");

  const channelInput = new TextInputBuilder()
    .setCustomId(CUSTOM_IDS.fieldChannel)
    .setLabel("Target Channel ID")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. 123456789012345678")
    .setRequired(true)
    .setMinLength(17)
    .setMaxLength(20);

  const titleInput = new TextInputBuilder()
    .setCustomId(CUSTOM_IDS.fieldTitle)
    .setLabel("Embed Title")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(256);

  const descriptionInput = new TextInputBuilder()
    .setCustomId(CUSTOM_IDS.fieldDescription)
    .setLabel("Description")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000);

  const colorInput = new TextInputBuilder()
    .setCustomId(CUSTOM_IDS.fieldColor)
    .setLabel("Hex Color")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("#FFD700")
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(7);

  modal.addComponents(
    new ActionRowBuilder().addComponents(channelInput),
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descriptionInput),
    new ActionRowBuilder().addComponents(colorInput)
  );

  await interaction.showModal(modal);
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleBroadcastModal(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "Only Administrators can create broadcasts.",
      ephemeral: true,
    });
    return;
  }

  const channelId = interaction.fields
    .getTextInputValue(CUSTOM_IDS.fieldChannel)
    .trim();
  const title = interaction.fields
    .getTextInputValue(CUSTOM_IDS.fieldTitle)
    .trim();
  const description = interaction.fields
    .getTextInputValue(CUSTOM_IDS.fieldDescription)
    .trim();
  const hexRaw = interaction.fields
    .getTextInputValue(CUSTOM_IDS.fieldColor)
    .trim();

  if (!/^\d{17,20}$/.test(channelId)) {
    await interaction.reply({
      content: "Invalid Target Channel ID. Use a numeric snowflake ID.",
      ephemeral: true,
    });
    return;
  }

  const color = parseHexColor(hexRaw);
  if (color === null) {
    await interaction.reply({
      content: "Invalid Hex Color. Use formats like `#FFD700` or `FFD700`.",
      ephemeral: true,
    });
    return;
  }

  const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    await interaction.reply({
      content: "Target channel not found or is not a text channel in this bot's reach.",
      ephemeral: true,
    });
    return;
  }

  if (
    interaction.guildId &&
    "guildId" in channel &&
    channel.guildId !== interaction.guildId
  ) {
    await interaction.reply({
      content: "Target channel must belong to this server.",
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "FastPromo" })
    .setTimestamp();

  await channel.send({ embeds: [embed] });

  await interaction.reply({
    content: `Broadcast sent to <#${channel.id}>.`,
    ephemeral: true,
  });
}

/**
 * @param {string} input
 * @returns {number | null}
 */
function parseHexColor(input) {
  const cleaned = input.replace(/^#/, "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(cleaned) && !/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
    return null;
  }
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  return Number.parseInt(full, 16);
}
