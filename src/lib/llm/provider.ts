import { z } from "zod";

export class ProviderError extends Error {
  constructor(
    public readonly code: "timeout" | "unavailable" | "invalid" | "not_configured",
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function isAiConfigured() {
  const provider = (process.env.LLM_PROVIDER ?? "").trim().toLowerCase();
  const model = (process.env.LLM_MODEL ?? "").trim();
  const key =
    provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : provider === "openai"
        ? process.env.OPENAI_API_KEY
        : "";
  return {
    aiConfigured: Boolean(provider && model && key),
    provider: provider || null,
    model: model || null,
  };
}

export async function completeJson(prompt: string, timeoutMs = 45_000): Promise<string> {
  const status = isAiConfigured();
  if (!status.aiConfigured || !status.provider || !status.model) {
    throw new ProviderError("not_configured", "AI isn't configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (status.provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: status.model,
          max_tokens: 1200,
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new ProviderError("unavailable", "provider");
      const data = (await response.json()) as {
        content?: Array<{ text?: string }>;
      };
      const text = data.content?.map((part) => part.text ?? "").join("\n") ?? "";
      return stripFences(text);
    }

    if (status.provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
        },
        body: JSON.stringify({
          model: status.model,
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new ProviderError("unavailable", "provider");
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return stripFences(data.choices?.[0]?.message?.content ?? "");
    }

    throw new ProviderError("not_configured", "AI isn't configured");
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError("timeout", "timeout");
    }
    throw new ProviderError("unavailable", "provider");
  } finally {
    clearTimeout(timer);
  }
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

export const groupingMapSchema = z.record(z.string(), z.string());

export const generateSchema = z.object({
  theme_summaries: z
    .array(z.object({ theme: z.string(), summary: z.string() }))
    .length(3),
  quote_ids: z.array(z.string()).length(3).optional(),
  actions: z.array(z.object({ title: z.string(), detail: z.string() })).length(3),
});
