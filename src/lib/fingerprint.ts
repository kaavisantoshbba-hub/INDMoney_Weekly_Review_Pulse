import type { ReviewRow } from "@/lib/types";

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function normalisedFingerprintPayload(rows: ReviewRow[]): string {
  return rows
    .map((row) =>
      [
        row.platform,
        row.dateRaw.trim(),
        String(row.rating),
        row.title.trim(),
        row.review.trim(),
      ].join("\t"),
    )
    .join("\n");
}

export async function fingerprintRows(rows: ReviewRow[]): Promise<string> {
  const payload = normalisedFingerprintPayload(rows);
  const encoded = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(digest);
}
