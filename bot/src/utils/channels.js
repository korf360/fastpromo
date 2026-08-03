import { ChannelType } from "discord.js";

/**
 * @param {import('discord.js').Guild} guild
 * @param {string} name
 * @param {ChannelType | null} [type]
 */
export function findChannelByName(guild, name, type = ChannelType.GuildText) {
  return (
    guild.channels.cache.find(
      (ch) => ch.name === name && (type === null || ch.type === type)
    ) ?? null
  );
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {string} name
 */
export function findCategoryByName(guild, name) {
  return findChannelByName(guild, name, ChannelType.GuildCategory);
}

export const CHANNEL_NAMES = {
  supportTickets: "✦｜sᴜᴘᴘᴏʀᴛ-ᴛɪᴄᴋᴇᴛs",
  gameRanges: "✦｜ɢᴀᴍᴇ-ʀᴀɴɢᴇs",
  topupCmds: "✦｜ᴛᴏᴘᴜᴘ-ᴀɴ-ᴄᴍᴅs",
  serverStatus: "✦｜sᴇʀᴠᴇʀ-sᴛᴀᴛᴜs",
  giveaways: "✦｜ɢɪᴠᴇᴀᴡᴀʏs-ᴀɴ-ᴇᴠᴇɴᴛs",
  logs: "✦｜ʟᴏɢs",
  embedPanel: "✦｜ᴇᴍʙᴇᴅ-ᴘᴀɴᴇʟ",
  privateSupportCategory: "🛠️ ┃ ᴘʀɪᴠᴀᴛᴇ sᴜᴘᴘᴏʀᴛ",
};

/**
 * @param {import('discord.js').Message} message
 * @param {string} customId
 */
export function messageHasCustomId(message, customId) {
  return message.components.some((row) =>
    row.components.some((c) => "customId" in c && c.customId === customId)
  );
}
