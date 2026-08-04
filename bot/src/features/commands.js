import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { IDS } from "../lib/ids.js";
import {
  PRODUCT_CATALOG,
  formatEuroFromCents,
  isProductId,
  DIAMOND_MARK,
} from "../lib/products.js";
import { startGiveaway } from "./giveaway.js";
import { upsertStatusEmbed } from "./status.js";
import { parseDurationMs, sanitizePlayerId } from "../utils/sanitize.js";
import { resolvePublicShopUrl } from "../utils/shopUrl.js";

/**
 * @param {string} clientId
 * @param {string} token
 */
export async function registerSlashCommands(clientId, token) {
  const commands = [
    new SlashCommandBuilder()
      .setName("prices")
      .setDescription("View FastPromo diamond pricing tiers"),
    new SlashCommandBuilder()
      .setName("order")
      .setDescription("Look up a FastPromo order by support ID or Stripe session")
      .addStringOption((o) =>
        o
          .setName("transaction_id")
          .setDescription("Support ID (FP-YYYY-XXXXXXXX) or Stripe cs_...")
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("topup")
      .setDescription("Start a secure diamond top-up checkout"),
    new SlashCommandBuilder()
      .setName("status")
      .setDescription("Update the public server status board (Admin)")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption((o) =>
        o
          .setName("api_status")
          .setDescription("Supplier / API status")
          .setRequired(true)
          .addChoices(
            { name: "ONLINE", value: "ONLINE" },
            { name: "MAINTENANCE", value: "MAINTENANCE" }
          )
      )
      .addStringOption((o) =>
        o
          .setName("game_status")
          .setDescription("Game delivery status")
          .setRequired(true)
          .addChoices(
            { name: "ONLINE", value: "ONLINE" },
            { name: "MAINTENANCE", value: "MAINTENANCE" }
          )
      ),
    new SlashCommandBuilder()
      .setName("giveaway")
      .setDescription("Start an automated giveaway (Admin)")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption((o) =>
        o
          .setName("duration")
          .setDescription("e.g. 10m, 1h, 1d")
          .setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("prize").setDescription("Prize description").setRequired(true)
      ),
  ].map((c) => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log(`✅ Registered ${commands.length} global slash commands.`);
}

/**
 * @param {import('discord.js').Client} client
 * @param {{ siteUrl: string, guildId: string }} ctx
 */
export function registerCommandHandlers(client, ctx) {
  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
          case "prices":
            await cmdPrices(interaction, ctx.siteUrl);
            break;
          case "order":
            await cmdOrder(interaction, ctx.siteUrl);
            break;
          case "topup":
            await cmdTopupModal(interaction);
            break;
          case "status":
            await cmdStatus(interaction);
            break;
          case "giveaway":
            await cmdGiveaway(interaction);
            break;
          default:
            break;
        }
        return;
      }

      if (
        interaction.isModalSubmit() &&
        interaction.customId === IDS.topupModal
      ) {
        await handleTopupModal(interaction);
        return;
      }

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId.startsWith(`${IDS.topupPackageSelect}:`)
      ) {
        await handleTopupPackageSelect(interaction, ctx.siteUrl);
      }
    } catch (err) {
      console.error("[commands]", err);
      const payload = {
        content: "Command failed. Please try again shortly.",
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
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} siteUrl
 */
async function cmdPrices(interaction, siteUrl) {
  const shop = resolvePublicShopUrl(siteUrl);

  const packLines = [];
  const passLines = [];

  for (const p of Object.values(PRODUCT_CATALOG)) {
    const price = `**${formatEuroFromCents(p.priceInCents)}**`;
    const badge = p.badge ? ` · *${p.badge}*` : "";

    if (typeof p.diamonds === "number") {
      const qty = p.diamonds.toLocaleString("en-GB");
      packLines.push(
        `${DIAMOND_MARK} **${qty}** Diamonds — ${price}${badge}`
      );
    } else {
      passLines.push(`✦ **${p.name}** — ${price}${badge}`);
    }
  }

  const description = [
    "**Diamond packs**",
    ...packLines,
    "",
    "**Passes**",
    ...passLines,
    "",
    "Secure Stripe checkout · Instant delivery to your player ID.",
  ].join("\n");

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("FastPromo · Prices")
    .setDescription(description)
    .setFooter({ text: "Prices in EUR · European market" });

  if (shop) {
    embed.setURL(`${shop}/packages`);
    embed.setThumbnail(`${shop}/discord/bot-icon-f-diamond.png`);
  }

  /** @type {import('discord.js').ActionRowBuilder[]} */
  const components = [];
  if (shop) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Open shop")
          .setStyle(ButtonStyle.Link)
          .setURL(`${shop}/packages`)
      )
    );
  }

  try {
    await interaction.reply({
      embeds: [embed],
      components,
      ephemeral: true,
    });
  } catch (err) {
    // Link/thumbnail URL issues must not hide the price list.
    console.error("[prices] rich reply failed, falling back:", err);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle("FastPromo · Prices")
          .setDescription(description)
          .setFooter({ text: "Prices in EUR · European market" }),
      ],
      ephemeral: true,
    });
  }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} siteUrl
 */
async function cmdOrder(interaction, siteUrl) {
  const transactionId = interaction.options.getString("transaction_id", true).trim();
  const isReceipt = /^FP-\d{4}-[A-Z0-9]{8}$/i.test(transactionId);
  const isStripe = /^cs_[a-zA-Z0-9_]+$/.test(transactionId);

  if (!isReceipt && !isStripe) {
    await interaction.reply({
      content:
        "Invalid reference. Ask the user for their **Support ID** from Account → Purchase activity (looks like `FP-2026-ABCD1234`), or a Stripe session ID starting with `cs_`.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const res = await fetch(
    `${siteUrl}/api/orders/${encodeURIComponent(transactionId)}`,
    { method: "GET", headers: { Accept: "application/json" } }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    await interaction.editReply({
      content:
        typeof data.error === "string"
          ? data.error
          : "Could not fetch order status from the web backend.",
    });
    return;
  }

  const status = String(data.status || "Unknown");
  const dbStatus = data.dbStatus ? String(data.dbStatus) : null;
  const color =
    status === "Completed" || status === "Paid"
      ? 0x22c55e
      : status === "Failed"
        ? 0xef4444
        : 0xf59e0b;

  const fmtTime = (iso) => {
    if (!iso || typeof iso !== "string") return null;
    try {
      return `<t:${Math.floor(new Date(iso).getTime() / 1000)}:f>`;
    } catch {
      return iso;
    }
  };

  const supportId = data.receiptNumber
    ? String(data.receiptNumber)
    : isReceipt
      ? transactionId.toUpperCase()
      : "—";

  const fields = [
    { name: "Support ID", value: `\`${supportId}\``, inline: true },
    {
      name: "Pipeline status",
      value: dbStatus
        ? `**${status}** · \`${dbStatus}\``
        : `**${status}** · Stripe only`,
      inline: true,
    },
    {
      name: "Payment",
      value:
        data.paymentStatus === "paid" ||
        dbStatus === "paid" ||
        dbStatus === "fulfilled" ||
        dbStatus === "failed"
          ? "✅ Captured (Stripe paid)"
          : data.paymentStatus
            ? `\`${data.paymentStatus}\``
            : "—",
      inline: true,
    },
    {
      name: "Product",
      value: data.productLabel || data.productId || "—",
      inline: true,
    },
    {
      name: "Player",
      value:
        data.userId && data.zoneId
          ? `\`${data.userId}\` / Zone \`${data.zoneId}\``
          : "—",
      inline: true,
    },
    {
      name: "Amount charged",
      value: data.amountFormatted || "—",
      inline: true,
    },
  ];

  if (data.customerEmail) {
    fields.push({
      name: "Account email",
      value: `\`${data.customerEmail}\``,
      inline: true,
    });
  }

  if (data.promoCode) {
    fields.push({
      name: "Promo",
      value: `\`${data.promoCode}\`${
        data.promoDiscountCents
          ? ` (−${(Number(data.promoDiscountCents) / 100).toFixed(2)} €)`
          : ""
      }`,
      inline: true,
    });
  }

  if (data.cashbackAppliedCents > 0 || data.cashbackEarnedCents > 0) {
    fields.push({
      name: "Wallet",
      value: [
        data.cashbackAppliedCents > 0
          ? `Applied ${(Number(data.cashbackAppliedCents) / 100).toFixed(2)} €`
          : null,
        data.cashbackEarnedCents > 0
          ? `Earned +${(Number(data.cashbackEarnedCents) / 100).toFixed(2)} €`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      inline: true,
    });
  }

  if (data.moogoldOrderRef) {
    fields.push({
      name: "Supplier order",
      value: `\`${data.moogoldOrderRef}\``,
      inline: true,
    });
  }

  const timelineBits = [
    data.timeline?.created || data.createdAt
      ? `Created ${fmtTime(data.timeline?.created || data.createdAt)}`
      : null,
    data.timeline?.paid ? `Paid ${fmtTime(data.timeline.paid)}` : null,
    data.timeline?.fulfilled
      ? `Delivered ${fmtTime(data.timeline.fulfilled)}`
      : null,
    data.timeline?.failed ? `Failed ${fmtTime(data.timeline.failed)}` : null,
  ].filter(Boolean);

  if (timelineBits.length) {
    fields.push({
      name: "Timeline",
      value: timelineBits.join("\n"),
      inline: false,
    });
  }

  if (data.failure) {
    fields.push({
      name: "⚠ Failure diagnosis",
      value: [
        `**Category:** ${data.failure.categoryLabel || data.failure.category || "Unknown"}`,
        `**Why:** ${data.failure.reason || "No reason stored"}`,
        data.failure.guidance
          ? `**Admin next step:** ${data.failure.guidance}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 1024),
      inline: false,
    });

    if (data.failure.detail) {
      fields.push({
        name: "Raw supplier / system detail",
        value: `\`\`\`\n${String(data.failure.detail).slice(0, 900)}\n\`\`\``,
        inline: false,
      });
    }
  } else if (dbStatus === "failed") {
    fields.push({
      name: "⚠ Failure diagnosis",
      value:
        "Marked **failed**, but no diagnostic was stored (likely an older order). Check Vercel webhook logs for this Stripe session.",
      inline: false,
    });
  } else if (dbStatus === "paid") {
    fields.push({
      name: "Delivery note",
      value:
        "Payment captured; diamonds not marked delivered yet. May still be processing — re-check in a minute or inspect webhook logs.",
      inline: false,
    });
  } else if (dbStatus === "fulfilled") {
    fields.push({
      name: "Delivery note",
      value: "Marked delivered successfully. If the player still missing diamonds, verify User/Zone ID and supplier order ref.",
      inline: false,
    });
  }

  if (data.sessionId) {
    fields.push({
      name: "Stripe session",
      value: `\`${data.sessionId}\``,
      inline: false,
    });
  }

  const titlePrefix =
    status === "Failed"
      ? "Order failed"
      : status === "Completed"
        ? "Order delivered"
        : status === "Paid"
          ? "Order paid — awaiting delivery"
          : "Order lookup";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${titlePrefix} · ${supportId}`)
    .setDescription(
      status === "Failed"
        ? "Payment may still be captured. Use the diagnosis below before refunding or re-delivering."
        : "Support report for Discord tickets. Source: Account → Purchase activity Support ID."
    )
    .addFields(fields)
    .setFooter({
      text: `Source: ${data.source || "unknown"} · FastPromo admin lookup`,
    })
    .setTimestamp(data.createdAt ? new Date(data.createdAt) : undefined);

  await interaction.editReply({ embeds: [embed] });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function cmdTopupModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId(IDS.topupModal)
    .setTitle("Diamond Top-Up");

  const userIdInput = new TextInputBuilder()
    .setCustomId(IDS.topupUserId)
    .setLabel("User ID")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Digits only")
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(20);

  const zoneIdInput = new TextInputBuilder()
    .setCustomId(IDS.topupZoneId)
    .setLabel("Zone ID")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Digits only")
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(10);

  modal.addComponents(
    new ActionRowBuilder().addComponents(userIdInput),
    new ActionRowBuilder().addComponents(zoneIdInput)
  );

  await interaction.showModal(modal);
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleTopupModal(interaction) {
  const userId = sanitizePlayerId(
    interaction.fields.getTextInputValue(IDS.topupUserId)
  );
  const zoneId = sanitizePlayerId(
    interaction.fields.getTextInputValue(IDS.topupZoneId)
  );

  if (!userId || !zoneId) {
    await interaction.reply({
      content: "User ID and Zone ID must be numeric only.",
      ephemeral: true,
    });
    return;
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${IDS.topupPackageSelect}:${userId}:${zoneId}`)
    .setPlaceholder("Select diamond package")
    .addOptions(
      Object.entries(PRODUCT_CATALOG).map(([id, p]) => ({
        label: p.name,
        value: id,
        description: formatEuroFromCents(p.priceInCents),
      }))
    );

  await interaction.reply({
    content: `Player \`${userId}\` (Zone \`${zoneId}\`) — choose a package:`,
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true,
  });
}

/**
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {string} siteUrl
 */
async function handleTopupPackageSelect(interaction, siteUrl) {
  const parts = interaction.customId.split(":");
  const userId = sanitizePlayerId(parts[1] ?? "");
  const zoneId = sanitizePlayerId(parts[2] ?? "");
  const productId = interaction.values[0];

  if (!userId || !zoneId || !isProductId(productId)) {
    await interaction.reply({
      content: "Invalid top-up payload. Run `/topup` again.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferUpdate();

  const res = await fetch(`${siteUrl}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, zoneId, productId }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.redirectUrl) {
    await interaction.editReply({
      content:
        typeof data.error === "string"
          ? data.error
          : "Could not create Stripe checkout. Try the website.",
      components: [],
    });
    return;
  }

  const product = PRODUCT_CATALOG[productId];
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Pay Securely with Stripe")
      .setStyle(ButtonStyle.Link)
      .setURL(data.redirectUrl)
  );

  await interaction.editReply({
    content:
      `Checkout ready for **${product.name}** → \`${userId}\` (Zone \`${zoneId}\`).\n` +
      "This link is personal — do not share it.",
    embeds: [
      new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("Secure Payment Link")
        .setDescription(
          `Session: \`${data.sessionId || "created"}\`\nPrice: **${formatEuroFromCents(product.priceInCents)}**`
        ),
    ],
    components: [row],
  });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function cmdStatus(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "Administrator only.",
      ephemeral: true,
    });
    return;
  }

  if (!interaction.guild) {
    await interaction.reply({ content: "Guild only.", ephemeral: true });
    return;
  }

  const apiStatus = /** @type {'ONLINE'|'MAINTENANCE'} */ (
    interaction.options.getString("api_status", true)
  );
  const gameStatus = /** @type {'ONLINE'|'MAINTENANCE'} */ (
    interaction.options.getString("game_status", true)
  );

  await interaction.deferReply({ ephemeral: true });
  await upsertStatusEmbed(interaction.guild, apiStatus, gameStatus);
  await interaction.editReply({
    content: `Status board updated → API **${apiStatus}**, Game **${gameStatus}**.`,
  });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function cmdGiveaway(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "Administrator only.",
      ephemeral: true,
    });
    return;
  }

  if (!interaction.guild) {
    await interaction.reply({ content: "Guild only.", ephemeral: true });
    return;
  }

  const durationRaw = interaction.options.getString("duration", true);
  const prize = interaction.options.getString("prize", true).trim();
  const durationMs = parseDurationMs(durationRaw);

  if (!durationMs || durationMs < 15_000 || durationMs > 7 * 24 * 60 * 60 * 1000) {
    await interaction.reply({
      content: "Invalid duration. Use e.g. `10m`, `1h`, `1d` (min 15s, max 7d).",
      ephemeral: true,
    });
    return;
  }

  if (!prize || prize.length > 200) {
    await interaction.reply({
      content: "Prize must be 1–200 characters.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const msg = await startGiveaway(
    interaction.guild,
    prize,
    durationMs,
    interaction.user
  );
  await interaction.editReply({
    content: `Giveaway started in ${msg.channel}: ${msg.url}`,
  });
}
