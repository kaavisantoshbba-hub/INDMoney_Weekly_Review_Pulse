import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const file = path.join(process.cwd(), "prompts", "weekly_pulse_prompt.txt");
  const template = await fs.readFile(file, "utf8");
  return NextResponse.json({ template });
}
