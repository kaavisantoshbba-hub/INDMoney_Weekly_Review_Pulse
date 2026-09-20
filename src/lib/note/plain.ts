import { formatCount } from "@/lib/share";
import type { WeeklyNote } from "@/lib/types";

export function noteToPlainText(note: WeeklyNote): string {
  const themeLines = note.themes
    .map(
      (theme, index) =>
        `${index + 1}. ${theme.theme} — ${theme.count} · ${theme.share.toFixed(1)}%\n${theme.summary}`,
    )
    .join("\n\n");
  const quoteLines = note.quotes.map((quote) => `"${quote.text}"`).join("\n\n");
  const actionLines = note.actions
    .map((action, index) => `${index + 1}. ${action.title} ${action.detail}`)
    .join("\n\n");

  return [
    "INDMoney — Weekly Review Pulse",
    note.dateRangeLabel,
    `${formatCount(note.reviewCount)} reviews`,
    "",
    "TOP 3 THEMES",
    "",
    themeLines,
    "",
    "REAL USER VOICE",
    "",
    quoteLines,
    "",
    "RECOMMENDED ACTIONS",
    "",
    actionLines,
    "",
    "METHODOLOGY",
    "",
    note.methodology,
    "",
  ].join("\n");
}
