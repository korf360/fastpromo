import { getMerchantProfile } from "@/lib/receipt";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-static";

export async function GET() {
  const merchant = getMerchantProfile();
  const site = getSiteUrl();
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const body = [
    `Contact: mailto:${merchant.supportEmail}`,
    `Contact: ${merchant.supportUrl}`,
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en, es",
    `Canonical: ${site}/.well-known/security.txt`,
    "Policy: " + `${site}/privacy`,
  ].join("\n");

  return new Response(`${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
