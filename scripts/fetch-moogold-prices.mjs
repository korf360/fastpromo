import fs from "fs";

const urls = [
  "https://moogold.com/product/mobile-legends/",
  "https://moogold.com/product/mobile-legends-united-states/",
];

function decodeHtml(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
}

for (const url of urls) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en" },
  });
  const html = await res.text();
  console.log("\n===", url, "status", res.status);

  const m = html.match(/data-product_variations="([^"]+)"/);
  if (!m) {
    console.log("no data-product_variations");
    // fallback: look for form.variations_form
    const m2 = html.match(/data-product_variations='([^']+)'/);
    if (!m2) {
      fs.writeFileSync("scripts/_moogold_sample.html", html.slice(0, 50000));
      console.log("saved sample html head");
      continue;
    }
    const vars = JSON.parse(decodeHtml(m2[1]));
    dumpVars(vars);
    continue;
  }

  const vars = JSON.parse(decodeHtml(m[1]));
  dumpVars(vars);
}

function dumpVars(vars) {
  console.log("variations", vars.length);
  const rows = [];
  for (const v of vars) {
    const attrs = v.attributes || {};
    const name =
      attrs.attribute_amount ||
      attrs.attribute_pa_amount ||
      attrs.attribute_diamonds ||
      Object.values(attrs)[0] ||
      String(v.variation_id);
    rows.push({
      name: String(name),
      price: v.display_price,
      regular: v.display_regular_price,
      id: v.variation_id,
    });
  }
  rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  for (const r of rows) {
    console.log(
      `${r.name.padEnd(42)} $${Number(r.price).toFixed(2)}  (reg $${Number(r.regular).toFixed(2)})  id=${r.id}`
    );
  }
}
