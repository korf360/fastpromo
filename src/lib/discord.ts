type DiscordEmbed = {
  title: string;
  description: string;
  color: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
  footer?: { text: string };
};

const COLOR_SUCCESS = 0x22c55e;
const COLOR_FAILURE = 0xef4444;

export async function sendDiscordAudit(payload: {
  embeds: DiscordEmbed[];
  content?: string;
}): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) {
    console.error(
      "[discord] DISCORD_WEBHOOK_URL is not configured — audit embed skipped."
    );
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "FastPromo Logs",
        content: payload.content,
        embeds: payload.embeds,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[discord] Webhook dispatch failed:", res.status, text);
    }
  } catch (err) {
    console.error("[discord] Webhook dispatch exception:", err);
  }
}

export function buildSuccessEmbed(input: {
  userId: string;
  zoneId: string;
  productName: string;
  productId: string;
  sessionId: string;
  moogoldOrderRef?: string;
}): DiscordEmbed {
  return {
    title: "🟢 [FastPromo] Top-up Successful",
    description: `🟢 [FastPromo] Top-up Successful | User: ${input.userId} (Zone ${input.zoneId}) received Product ${input.productName}`,
    color: COLOR_SUCCESS,
    fields: [
      { name: "User ID", value: `\`${input.userId}\``, inline: true },
      { name: "Zone ID", value: `\`${input.zoneId}\``, inline: true },
      { name: "Product", value: input.productName, inline: true },
      { name: "Catalog Key", value: `\`${input.productId}\``, inline: true },
      { name: "Stripe Session", value: `\`${input.sessionId}\``, inline: false },
      ...(input.moogoldOrderRef
        ? [
            {
              name: "MooGold Ref",
              value: `\`${input.moogoldOrderRef}\``,
              inline: false,
            },
          ]
        : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "✦｜ʟᴏɢs · FastPromo fulfillment" },
  };
}

export function buildFailureEmbed(input: {
  userId: string;
  zoneId: string;
  productName: string;
  productId: string;
  sessionId: string;
  error: string;
  moogoldRaw?: string;
}): DiscordEmbed {
  return {
    title: "🔴 [FastPromo] Top-up FAILED — Action Required",
    description: `High-priority fulfillment failure for User \`${input.userId}\` (Zone \`${input.zoneId}\`) · Product **${input.productName}**`,
    color: COLOR_FAILURE,
    fields: [
      { name: "User ID", value: `\`${input.userId}\``, inline: true },
      { name: "Zone ID", value: `\`${input.zoneId}\``, inline: true },
      { name: "Product", value: input.productName, inline: true },
      { name: "Catalog Key", value: `\`${input.productId}\``, inline: true },
      { name: "Stripe Session", value: `\`${input.sessionId}\``, inline: false },
      {
        name: "Exception",
        value: truncate(`\`\`\`\n${input.error}\n\`\`\``, 1024),
        inline: false,
      },
      ...(input.moogoldRaw
        ? [
            {
              name: "MooGold Response",
              value: truncate(`\`\`\`json\n${input.moogoldRaw}\n\`\`\``, 1024),
              inline: false,
            },
          ]
        : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "✦｜ʟᴏɢs · FastPromo ops alert" },
  };
}

export function buildAdminPing(): string | undefined {
  const roleId = process.env.DISCORD_ADMIN_ROLE_ID?.trim();
  const userId = process.env.DISCORD_ADMIN_USER_ID?.trim();

  const mentions: string[] = [];
  if (roleId) mentions.push(`<@&${roleId}>`);
  if (userId) mentions.push(`<@${userId}>`);

  if (mentions.length === 0) {
    return "🚨 **ADMIN ALERT** — MooGold fulfillment failed. Manual intervention required.";
  }

  return `${mentions.join(" ")} 🚨 **ADMIN ALERT** — MooGold fulfillment failed. Manual intervention required.`;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}
