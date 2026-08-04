import { formatCents } from "@/lib/cashback-config";

export type MerchantProfile = {
  brandName: string;
  legalName: string;
  addressLines: string[];
  vatId: string | null;
  supportEmail: string;
  supportUrl: string;
  country: string;
  /** True when enough legal identity is configured for a fuller fiscal-style receipt. */
  hasLegalIdentity: boolean;
};

export function getMerchantProfile(): MerchantProfile {
  const brandName =
    process.env.RECEIPT_BRAND_NAME?.trim() ||
    process.env.NEXT_PUBLIC_BRAND_NAME?.trim() ||
    "FastPromo";
  const legalName =
    process.env.RECEIPT_LEGAL_NAME?.trim() || brandName;
  const addressRaw = process.env.RECEIPT_LEGAL_ADDRESS?.trim() || "";
  const addressLines = addressRaw
    ? addressRaw.split("|").map((l) => l.trim()).filter(Boolean)
    : [];
  const vatId = process.env.RECEIPT_VAT_ID?.trim() || null;
  const supportEmail =
    process.env.RECEIPT_SUPPORT_EMAIL?.trim() ||
    process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
    "korf360@gmail.com";
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://fastpromo.eu";
  const supportUrl =
    process.env.RECEIPT_SUPPORT_URL?.trim() || "https://discord.gg/fastpromo";
  const country = process.env.RECEIPT_COUNTRY?.trim() || "EU";

  const hasLegalIdentity = Boolean(
    process.env.RECEIPT_LEGAL_NAME?.trim() &&
      addressLines.length > 0
  );

  return {
    brandName,
    legalName,
    addressLines,
    vatId,
    supportEmail,
    supportUrl: supportUrl || site,
    country,
    hasLegalIdentity,
  };
}

export type ReceiptOrderData = {
  id: string;
  receiptNumber: string;
  createdAt: Date;
  status: string;
  productLabel: string;
  productId: string;
  mlbbUserId: string;
  mlbbZoneId: string;
  /** Catalog / list price before discounts */
  catalogPriceCents: number;
  promoDiscountCents: number;
  promoCodeSnapshot: string | null;
  cashbackAppliedCents: number;
  cashbackEarnedCents: number;
  /** Net amount charged via Stripe */
  amountCents: number;
  currency: string;
  stripeSessionId: string;
  customerEmail: string;
  customerName: string | null;
};

export function resolveCatalogPriceCents(order: {
  amountCents: number;
  promoDiscountCents: number;
  cashbackAppliedCents: number;
}): number {
  return (
    order.amountCents + order.promoDiscountCents + order.cashbackAppliedCents
  );
}

export function buildReceiptNumber(orderId: string, createdAt: Date): string {
  const y = createdAt.getUTCFullYear();
  const suffix = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `FP-${y}-${suffix}`;
}

function money(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return formatCents(cents);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReceiptDocument(
  order: ReceiptOrderData,
  options?: { receiptUrl?: string | null }
): {
  subject: string;
  htmlEmail: string;
  htmlPage: string;
  textEmail: string;
} {
  const merchant = getMerchantProfile();
  const receiptUrl = options?.receiptUrl?.trim() || null;
  const issued = order.createdAt.toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const docTitle = merchant.hasLegalIdentity
    ? "Payment receipt"
    : "Order payment receipt";
  const fiscalNote = merchant.hasLegalIdentity
    ? merchant.vatId
      ? `VAT / tax ID: ${merchant.vatId}. This document confirms payment for a digital service.`
      : "This document confirms payment for a digital service. VAT treatment depends on applicable consumer and digital-services rules in your country of residence."
    : "This is a payment confirmation / order receipt for a digital top-up service. It is not a substitute for a formal tax invoice until the merchant’s full legal identity (registered name, address, and tax ID where required) is completed on the platform.";

  const catalog = order.catalogPriceCents;
  const paid = order.amountCents;
  const currency = order.currency || "eur";

  const linesHtml = `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eceff3;">
        <strong>${escapeHtml(order.productLabel)}</strong><br/>
        <span style="color:#667085;font-size:12px;">Digital top-up · Player ${escapeHtml(order.mlbbUserId)} (${escapeHtml(order.mlbbZoneId)})</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #eceff3;text-align:right;white-space:nowrap;">${money(catalog, currency)}</td>
    </tr>
    ${
      order.promoDiscountCents > 0
        ? `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eceff3;color:#667085;font-size:13px;">
        Creator promo${order.promoCodeSnapshot ? ` (${escapeHtml(order.promoCodeSnapshot)})` : ""}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #eceff3;text-align:right;color:#027a48;">−${money(order.promoDiscountCents, currency)}</td>
    </tr>`
        : ""
    }
    ${
      order.cashbackAppliedCents > 0
        ? `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eceff3;color:#667085;font-size:13px;">Cashback credit applied</td>
      <td style="padding:8px 0;border-bottom:1px solid #eceff3;text-align:right;color:#027a48;">−${money(order.cashbackAppliedCents, currency)}</td>
    </tr>`
        : ""
    }
  `;

  const merchantBlock = `
    <strong>${escapeHtml(merchant.legalName)}</strong><br/>
    ${merchant.addressLines.map((l) => `${escapeHtml(l)}<br/>`).join("")}
    ${merchant.vatId ? `Tax / VAT ID: ${escapeHtml(merchant.vatId)}<br/>` : ""}
    Support: ${escapeHtml(merchant.supportEmail)}
  `;

  const bodyInner = `
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#b8860b;font-weight:700;">${escapeHtml(merchant.brandName)}</p>
    <h1 style="margin:0 0 8px;font-size:22px;color:#101828;">${docTitle}</h1>
    <p style="margin:0 0 20px;color:#667085;font-size:13px;">Issued ${escapeHtml(issued)} UTC · Receipt <strong>${escapeHtml(order.receiptNumber)}</strong></p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;font-size:13px;color:#344054;">
      <tr>
        <td style="vertical-align:top;width:50%;padding-right:12px;">
          <div style="color:#98a2b3;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Merchant</div>
          ${merchantBlock}
        </td>
        <td style="vertical-align:top;width:50%;">
          <div style="color:#98a2b3;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Customer</div>
          ${order.customerName ? `<strong>${escapeHtml(order.customerName)}</strong><br/>` : ""}
          ${escapeHtml(order.customerEmail)}
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#101828;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom:8px;border-bottom:2px solid #101828;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#667085;">Description</th>
          <th align="right" style="padding-bottom:8px;border-bottom:2px solid #101828;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#667085;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${linesHtml}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding-top:14px;font-weight:700;">Amount paid</td>
          <td style="padding-top:14px;text-align:right;font-weight:700;font-size:16px;">${money(paid, currency)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top:22px;padding:14px;background:#f8fafc;border:1px solid #e4e7ec;border-radius:8px;font-size:12px;color:#475467;line-height:1.55;">
      <strong style="color:#101828;">Payment & delivery</strong><br/>
      Payment processor: Stripe · Reference: ${escapeHtml(order.stripeSessionId)}<br/>
      Order status: ${escapeHtml(order.status)} · Currency: ${escapeHtml(currency.toUpperCase())}<br/>
      ${
        order.cashbackEarnedCents > 0
          ? `Cashback earned on this order: ${money(order.cashbackEarnedCents, currency)} (promotional store credit).<br/>`
          : ""
      }
      Digital goods are delivered electronically to the in-game account identifiers you provided. Keep this receipt for your records.
      ${
        receiptUrl
          ? `<br/><a href="${escapeHtml(receiptUrl)}" style="color:#b8860b;">View or print this receipt online</a>`
          : ""
      }
    </div>

    <p style="margin:18px 0 0;font-size:11px;color:#98a2b3;line-height:1.5;">${escapeHtml(fiscalNote)}</p>
  `;

  const htmlEmail = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#0d0f12;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f12;padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#FFD700,#c9a800);"></td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              ${bodyInner}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              <a href="${escapeHtml(merchant.supportUrl)}" style="display:inline-block;margin-top:8px;padding:11px 18px;background:#FFD700;color:#0d0f12;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Get support</a>
              <p style="margin:16px 0 0;font-size:11px;color:#98a2b3;">© ${new Date().getUTCFullYear()} ${escapeHtml(merchant.brandName)}. You received this email because you completed a purchase.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const htmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(docTitle)} ${escapeHtml(order.receiptNumber)}</title>
  <style>
    :root { color-scheme: light; }
    body { margin:0; background:#f4f5f7; color:#101828; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .wrap { max-width:720px; margin:32px auto; background:#fff; padding:36px; border:1px solid #e4e7ec; box-shadow:0 8px 30px rgba(16,24,40,.06); }
    .actions { max-width:720px; margin:0 auto 12px; display:flex; gap:8px; justify-content:flex-end; }
    .btn { appearance:none; border:1px solid #d0d5dd; background:#fff; padding:8px 14px; border-radius:8px; font-size:13px; cursor:pointer; text-decoration:none; color:#344054; }
    .btn-primary { background:#FFD700; border-color:#FFD700; color:#0d0f12; font-weight:700; }
    @media print {
      body { background:#fff; }
      .actions { display:none !important; }
      .wrap { margin:0; border:none; box-shadow:none; max-width:none; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button class="btn" type="button" onclick="window.print()">Print / Save PDF</button>
    <a class="btn btn-primary" href="/account">Back to account</a>
  </div>
  <div class="wrap">
    ${bodyInner}
  </div>
</body>
</html>`;

  const textEmail = [
    `${merchant.brandName} — ${docTitle}`,
    `Receipt: ${order.receiptNumber}`,
    `Issued: ${issued} UTC`,
    "",
    `Customer: ${order.customerName ? `${order.customerName} <${order.customerEmail}>` : order.customerEmail}`,
    `Product: ${order.productLabel}`,
    `Player: ${order.mlbbUserId} (${order.mlbbZoneId})`,
    `Catalog: ${money(catalog, currency)}`,
    order.promoDiscountCents > 0
      ? `Promo (${order.promoCodeSnapshot ?? "code"}): -${money(order.promoDiscountCents, currency)}`
      : null,
    order.cashbackAppliedCents > 0
      ? `Cashback applied: -${money(order.cashbackAppliedCents, currency)}`
      : null,
    `Amount paid: ${money(paid, currency)}`,
    `Stripe ref: ${order.stripeSessionId}`,
    `Status: ${order.status}`,
    "",
    fiscalNote,
    `Support: ${merchant.supportEmail} · ${merchant.supportUrl}`,
    receiptUrl ? `Online receipt: ${receiptUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `${merchant.brandName} receipt ${order.receiptNumber} — ${order.productLabel}`,
    htmlEmail,
    htmlPage,
    textEmail,
  };
}
