import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isOfficialTheme } from "@/config/themes";
import { completeJson, groupingMapSchema, ProviderError } from "@/lib/llm/provider";
import type { ThemeOrUnclassified } from "@/config/themes";

export const runtime = "nodejs";

const MAX_BYTES = 1_000_000;

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: { reviews?: Array<{ index: number; text: string }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const reviews = body.reviews ?? [];
  if (reviews.length === 0 || reviews.length > 120) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const template = await fs.readFile(
      path.join(process.cwd(), "prompts", "grouping_prompt.txt"),
      "utf8",
    );
    const prompt = template.replace(
      "{{BATCH_JSON}}",
      JSON.stringify(
        reviews.map((item) => ({
          index: String(item.index),
          text: String(item.text ?? "").slice(0, 500),
        })),
      ),
    );
    const raw = await completeJson(prompt);
    const parsed = groupingMapSchema.parse(JSON.parse(raw));
    const labels: Record<string, ThemeOrUnclassified> = {};
    for (const item of reviews) {
      const value = parsed[String(item.index)] ?? "Unclassified";
      labels[String(item.index)] = isOfficialTheme(value) ? value : "Unclassified";
    }
    return NextResponse.json({ labels });
  } catch (error) {
    const code = error instanceof ProviderError ? error.code : "unavailable";
    return NextResponse.json({ error: code }, { status: 503 });
  }
}
