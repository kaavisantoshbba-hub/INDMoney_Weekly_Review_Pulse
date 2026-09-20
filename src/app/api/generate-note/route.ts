import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { THEME_NAMES, isOfficialTheme, type ThemeName } from "@/config/themes";
import {
  completeJson,
  generateSchema,
  isAiConfigured,
  ProviderError,
} from "@/lib/llm/provider";
import { containsPiiPattern } from "@/lib/pii";
import { countWords, WORD_LIMIT } from "@/lib/wordcount";
import { measureNote, withMethodologyProvenance } from "@/lib/note/assemble";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 1_000_000;

type QuoteIn = { id: string; theme: string; text: string };
type ThemeIn = { theme: string; count: number; share: number };

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let payload: {
    dateRange?: string;
    reviewCount?: number;
    topThemes?: ThemeIn[];
    candidates?: QuoteIn[];
    pinnedQuotes?: QuoteIn[];
    proseWordBudget?: number;
    methodologyBase?: string;
    mode?: "full" | "validated_ai";
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  if (!isAiConfigured().aiConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 409 });
  }

  const topThemes = payload.topThemes ?? [];
  const pinned = payload.pinnedQuotes ?? [];
  const candidates = payload.candidates ?? [];
  const quotesForInsert = pinned.length ? pinned : candidates;
  const budget = payload.proseWordBudget ?? 90;
  const methodologyBase =
    payload.methodologyBase ??
    "Public review exports from Google Play and the App Store were combined for this look-back window. Reviews were grouped into a maximum of five themes. Generic or insufficiently detailed reviews were not forced into a theme. No usernames, emails, IDs, or other PII are included in this pulse.";

  try {
    const template = await fs.readFile(
      path.join(process.cwd(), "prompts", "weekly_pulse_prompt.txt"),
      "utf8",
    );

    let extra = "";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const prompt =
        template
          .replace("{{DATE_RANGE}}", String(payload.dateRange ?? ""))
          .replace("{{REVIEW_COUNT}}", String(payload.reviewCount ?? ""))
          .replace("{{TOP_THEMES_JSON}}", JSON.stringify(topThemes))
          .replace("{{CANDIDATE_QUOTES_JSON}}", JSON.stringify(candidates))
          .replace("{{PINNED_QUOTES_JSON}}", JSON.stringify(pinned))
          .replace("{{PROSE_WORD_BUDGET}}", String(budget)) + extra;

      const raw = await completeJson(prompt);
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        extra = "\nThe previous reply was not valid JSON. Return only the JSON object.";
        continue;
      }

      const parsed = generateSchema.safeParse(json);
      if (!parsed.success) {
        extra = "\nThe previous reply failed schema validation. Return only the JSON object in the schema.";
        continue;
      }

      const summaries = parsed.data.theme_summaries;
      const expectedThemes = topThemes.map((item) => item.theme);
      const namesOk = summaries.every(
        (item, index) => item.theme === expectedThemes[index] && isOfficialTheme(item.theme),
      );
      if (!namesOk) {
        extra = `\nTheme names must match this order exactly: ${expectedThemes.join(", ")}.`;
        continue;
      }

      let selectedQuotes = pinned;
      if (!pinned.length) {
        const ids = parsed.data.quote_ids ?? [];
        const unique = new Set(ids);
        if (ids.length !== 3 || unique.size !== 3) {
          extra = "\nProvide exactly 3 distinct quote_ids from the candidate list.";
          continue;
        }
        selectedQuotes = ids.map((id) => quotesForInsert.find((quote) => quote.id === id));
        if (selectedQuotes.some((quote) => !quote)) {
          extra = "\nquote_ids must exist in the candidate list.";
          continue;
        }
      }

      const quotes = selectedQuotes as QuoteIn[];
      const actions = parsed.data.actions;

      if (payload.mode === "validated_ai") {
        // Keep approved action titles; allow rewritten details only.
        // Titles are re-applied by the client from the approved set if provided as topThemes meta.
      }

      const assembled = {
        dateRangeLabel: String(payload.dateRange ?? ""),
        reviewCount: Number(payload.reviewCount ?? 0),
        themes: summaries.map((summary, index) => ({
          theme: summary.theme as ThemeName,
          summary: summary.summary,
          count: topThemes[index]?.count ?? 0,
          share: topThemes[index]?.share ?? 0,
        })),
        quotes: quotes.map((quote) => ({
          id: quote.id,
          theme: quote.theme as ThemeName,
          text: quote.text,
        })),
        actions,
        methodology: withMethodologyProvenance(methodologyBase, "ai"),
      };

      const blob = `${summaries.map((item) => item.summary).join(" ")} ${actions.map((item) => `${item.title} ${item.detail}`).join(" ")}`;
      if (containsPiiPattern(blob) || containsPiiPattern(assembled.methodology)) {
        extra = "\nRemove any emails, phones, handles, links or IDs from the prose.";
        continue;
      }

      const words = measureNote(assembled);
      if (words > WORD_LIMIT) {
        extra = `\nThe assembled note is ${words} words. Reduce prose by ${words - WORD_LIMIT} words. Do not rewrite quotes.`;
        continue;
      }

      if (countWords(blob) > budget + 40) {
        extra = `\nReduce your own prose toward ${budget} words.`;
        continue;
      }

      void THEME_NAMES;
      return NextResponse.json({
        theme_summaries: summaries,
        quotes,
        actions,
        wordCount: words,
      });
    }

    return NextResponse.json({ error: "invalid_output" }, { status: 422 });
  } catch (error) {
    const code = error instanceof ProviderError ? error.code : "unavailable";
    return NextResponse.json({ error: code }, { status: 503 });
  }
}
