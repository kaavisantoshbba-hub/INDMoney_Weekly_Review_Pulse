import type { ThemeName } from "@/config/themes";
import { countWords } from "@/lib/wordcount";
import { quotesMatchImportedReviews } from "@/lib/quotes";
import { containsPiiPattern } from "@/lib/pii";
import { formatCount } from "@/lib/share";
import type { ActionIdea, QuoteRecord, ThemeSummary, WeeklyNote } from "@/lib/types";

export function visibleNoteText(note: {
  dateRangeLabel: string;
  reviewCount: number;
  themes: Array<ThemeSummary & { count: number; share: number }>;
  quotes: QuoteRecord[];
  actions: ActionIdea[];
  methodology: string;
}): string {
  const parts: string[] = [
    "INDMoney",
    "Weekly Review Pulse",
    note.dateRangeLabel,
    `${formatCount(note.reviewCount)} reviews`,
    "INDMoney — Weekly Review Pulse",
    "TOP 3 THEMES",
  ];
  note.themes.forEach((theme, index) => {
    parts.push(
      String(index + 1),
      theme.theme,
      String(theme.count),
      `${theme.share.toFixed(1)}%`,
      theme.summary,
    );
  });
  parts.push("REAL USER VOICE");
  note.quotes.forEach((quote) => {
    parts.push(quote.text, quote.theme);
  });
  parts.push("RECOMMENDED ACTIONS");
  note.actions.forEach((action, index) => {
    parts.push(String(index + 1), action.title, action.detail);
  });
  parts.push("METHODOLOGY", note.methodology);
  return parts.join(" ");
}

export function measureNote(note: Parameters<typeof visibleNoteText>[0]): number {
  return countWords(visibleNoteText(note));
}

export function verifyNoteQuotes(note: WeeklyNote, reviews: string[]) {
  return quotesMatchImportedReviews(
    note.quotes.map((quote) => quote.text),
    reviews,
  );
}

export function noteContainsPii(note: WeeklyNote): boolean {
  const blob = visibleNoteText(note);
  return containsPiiPattern(blob);
}

export function sourceLabel(source: WeeklyNote["source"], provider?: string | null, model?: string | null): string {
  if (source === "validated") return "Validated current-week output";
  if (source === "template") return "Template draft — not AI-generated";
  const suffix = [provider, model].filter(Boolean).join(" · ");
  return suffix ? `AI-assisted · ${suffix}` : "AI-assisted";
}

export function provenanceClause(source: WeeklyNote["source"]): string | null {
  if (source === "ai") return "Drafted with AI assistance.";
  if (source === "template") return "Template draft.";
  return null;
}

export function withMethodologyProvenance(base: string, source: WeeklyNote["source"]): string {
  const clause = provenanceClause(source);
  if (!clause) return base;
  if (base.endsWith(clause)) return base;
  return `${base.replace(/\s+$/, "")} ${clause}`;
}

export type ThemeNameOnly = ThemeName;
