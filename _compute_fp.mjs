import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import Papa from "papaparse";

const csv = readFileSync("public/data/INDMoney_Reviews_Clean.csv", "utf8");
const parsed = Papa.parse(csv, {
  header: true,
  skipEmptyLines: "greedy",
  transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
});

const quotes = [
  "dashboards are not clear,",
  "Stock trade executed notification ( push notifications) not working at all. After many complaints and calls also no improvement. i get all other useless push notifications, but not trade executed notification, which is THE most important for a trader. US stock deposite process fails most of the time. also interface of portfolio and trading needs to improve a lot. kindly look in notification issue",
  "Cannot use any bank to transfer other than 5 listed by them. There's no way I'm gonna create new bank accounts just to trade.",
];

const reviews = parsed.data.map((r) => r.Review);
console.log("rows", parsed.data.length);
console.log("platforms", {
  gp: parsed.data.filter((r) => r.Platform === "Google Play").length,
  as: parsed.data.filter((r) => r.Platform === "App Store").length,
});
for (const q of quotes) {
  const i = reviews.indexOf(q);
  console.log("quote index", i, "len", q.length);
  if (i < 0) {
    const hit = reviews.findIndex((r) => r && r.includes(q.slice(0, 20)));
    console.log("partial", hit, hit >= 0 ? JSON.stringify(reviews[hit]) : "");
  }
}

const rows = parsed.data.map((r) => ({
  platform: r.Platform,
  dateRaw: r.Date,
  rating: String(r.Rating),
  title: (r.Title ?? "").trim(),
  review: (r.Review ?? "").trim(),
}));
rows.sort((a, b) => {
  const d = a.dateRaw.localeCompare(b.dateRaw);
  if (d !== 0) return d;
  return a.review.localeCompare(b.review);
});
const payload = rows
  .map((row) => [row.platform, row.dateRaw.trim(), String(row.rating), row.title, row.review].join("\t"))
  .join("\n");
const fp = createHash("sha256").update(payload).digest("hex");
console.log("fingerprint", fp);
