import validated from "../../../data/reference/validated_current_week.json";
import { formatRange } from "@/lib/dates";
import { measureNote, sourceLabel } from "@/lib/note/assemble";
import type { QuoteRecord, WeeklyNote } from "@/lib/types";

export const VALIDATED_FINGERPRINT = validated.fingerprint;

export function buildValidatedNote(): WeeklyNote {
  const start = new Date(2026, 5, 27);
  const end = new Date(2026, 8, 18);
  const quotes = validated.quotes as QuoteRecord[];
  const note: WeeklyNote = {
    source: "validated",
    sourceLabel: sourceLabel("validated"),
    provenanceClause: null,
    dateRangeLabel: formatRange(start, end),
    dateRangeLong: formatRange(start, end, true),
    reviewCount: validated.reviewCount,
    themes: validated.themeSummaries.map((summary, index) => ({
      theme: summary.theme as WeeklyNote["themes"][number]["theme"],
      summary: summary.summary,
      count: validated.themes[index].reviews,
      share: validated.themes[index].share,
    })),
    quotes,
    actions: validated.actions,
    methodology: validated.methodology,
    wordCount: 0,
    quotesVerified: true,
    piiClear: true,
  };
  note.wordCount = measureNote(note);
  return note;
}

export const APPROVED_EMAIL = {
  subject: validated.emailSubject,
  body: validated.emailBody.replace(/\n$/, "") + "\n",
};
