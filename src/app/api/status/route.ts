import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/llm/provider";

export const runtime = "nodejs";

export async function GET() {
  const status = isAiConfigured();
  return NextResponse.json({
    aiConfigured: status.aiConfigured,
    provider: status.aiConfigured ? status.provider : null,
    model: status.aiConfigured ? status.model : null,
  });
}
