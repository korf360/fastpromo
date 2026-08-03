import { ChannelType, PermissionsBitField } from "discord.js";

const F = PermissionsBitField.Flags;

/** @everyone may view + read history; no send / reactions / threads */
export const READ_ONLY = {
  allow: [F.ViewChannel, F.ReadMessageHistory],
  deny: [
    F.SendMessages,
    F.SendMessagesInThreads,
    F.CreatePublicThreads,
    F.CreatePrivateThreads,
    F.AddReactions,
    F.AttachFiles,
    F.EmbedLinks,
    F.MentionEveryone,
  ],
};

/** Open community / command channels */
export const OPEN_CHAT = {
  allow: [
    F.ViewChannel,
    F.ReadMessageHistory,
    F.SendMessages,
    F.AttachFiles,
    F.EmbedLinks,
    F.AddReactions,
    F.UseExternalEmojis,
    F.UseExternalStickers,
  ],
  deny: [F.MentionEveryone, F.ManageMessages],
};

/** Fully hidden from @everyone */
export const HIDDEN = {
  allow: [],
  deny: [F.ViewChannel],
};

/**
 * Full guild blueprint. Channel names use ✦｜ + small-caps Unicode (no yellow emojis).
 * @typedef {'readonly' | 'open' | 'hidden'} ChannelAccess
 * @typedef {{ name: string, access: ChannelAccess }} ChannelDef
 * @typedef {{ name: string, access: ChannelAccess, channels: ChannelDef[] }} CategoryDef
 */

/** @type {CategoryDef[]} */
export const GUILD_STRUCTURE = [
  {
    name: "📢 ┃ ɪɴꜰᴏʀᴍᴀᴄɪÓɴ",
    access: "readonly",
    channels: [
      { name: "✦｜ʀᴜʟᴇs-ᴀɴ-ɢᴜɪᴅᴇʟɪɴᴇs", access: "readonly" },
      { name: "✦｜ꜰᴀǫ-ǫᴜᴇsᴛɪᴏɴs", access: "readonly" },
      { name: "✦｜ᴀɴɴᴏᴜɴᴄᴇᴍᴇɴᴛs", access: "readonly" },
      { name: "✦｜ɢɪᴠᴇᴀᴡᴀʏs-ᴀɴ-ᴇᴠᴇɴᴛs", access: "readonly" },
      { name: "✦｜sᴇʀᴠᴇʀ-sᴛᴀᴛᴜs", access: "readonly" },
      { name: "✦｜ʙᴏᴛ-ɪɴꜰᴏ", access: "readonly" },
    ],
  },
  {
    name: "🛒 ┃ ᴀᴜᴛᴏᴍᴀᴛᴇᴅ sᴛᴏʀᴇ",
    access: "open",
    channels: [
      { name: "✦｜ᴡᴇʙsɪᴛᴇ-ʟɪɴᴋ", access: "readonly" },
      { name: "✦｜ᴘʀɪᴄᴇs-ᴀɴ-ʀᴀᴛᴇs", access: "readonly" },
      { name: "✦｜ɢᴀᴍᴇ-ʀᴀɴɢᴇs", access: "readonly" },
      { name: "✦｜ᴛᴏᴘᴜᴘ-ᴀɴ-ᴄᴍᴅs", access: "open" },
      { name: "✦｜sᴜᴘᴘᴏʀᴛ-ᴛɪᴄᴋᴇᴛs", access: "readonly" },
    ],
  },
  {
    name: "🤝 ┃ ᴄᴏᴍᴍᴜɴɪᴛʏ",
    access: "open",
    channels: [
      { name: "✦｜ɢᴇɴᴇʀᴀʟ-ᴄʜᴀᴛ", access: "open" },
      { name: "✦｜ʟᴏᴏᴋɪɴɢ-ꜰᴏʀ-sǫᴜᴀᴅ", access: "open" },
      { name: "✦｜ᴘᴜʀᴄʜᴀsᴇ-ᴠᴏᴜᴄʜᴇʀs", access: "open" },
    ],
  },
  {
    name: "🛠️ ┃ ᴘʀɪᴠᴀᴛᴇ sᴜᴘᴘᴏʀᴛ",
    access: "hidden",
    channels: [],
  },
  {
    name: "👑 ┃ ᴘʀɪᴠᴀᴛᴇ ᴀᴅᴍɪɴ",
    access: "hidden",
    channels: [
      { name: "✦｜ʟᴏɢs", access: "hidden" },
      { name: "✦｜ᴇᴍʙᴇᴅ-ᴘᴀɴᴇʟ", access: "hidden" },
    ],
  },
];

export const EMBED_PANEL_CHANNEL = "✦｜ᴇᴍʙᴇᴅ-ᴘᴀɴᴇʟ";

/** @deprecated use IDS from lib/ids.js — kept as CUSTOM_IDS for setupGuild compatibility */
export { IDS as CUSTOM_IDS } from "./lib/ids.js";

/**
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').ClientUser} botUser
 * @param {ChannelAccess} access
 */
export function buildOverwrites(guild, botUser, access) {
  const everyone = guild.roles.everyone;
  const map =
    access === "readonly"
      ? READ_ONLY
      : access === "open"
        ? OPEN_CHAT
        : HIDDEN;

  /** @type {import('discord.js').OverwriteResolvable[]} */
  const overwrites = [
    {
      id: everyone.id,
      allow: map.allow,
      deny: map.deny,
    },
    {
      id: botUser.id,
      allow: [
        F.ViewChannel,
        F.ReadMessageHistory,
        F.SendMessages,
        F.EmbedLinks,
        F.AttachFiles,
        F.ManageChannels,
        F.ManageMessages,
        F.ManageRoles,
      ],
    },
  ];

  // Explicit allow for roles that hold Administrator (hidden admin areas)
  if (access === "hidden") {
    for (const role of guild.roles.cache.values()) {
      if (role.id === everyone.id) continue;
      if (role.permissions.has(F.Administrator)) {
        overwrites.push({
          id: role.id,
          allow: [
            F.ViewChannel,
            F.ReadMessageHistory,
            F.SendMessages,
            F.EmbedLinks,
            F.AttachFiles,
            F.ManageMessages,
          ],
        });
      }
    }
  }

  return overwrites;
}

export { ChannelType, PermissionsBitField, F as PermissionFlags };
