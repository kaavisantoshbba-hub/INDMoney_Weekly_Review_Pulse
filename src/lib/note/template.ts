import type { ThemeName } from "@/config/themes";
import { themeByName } from "@/config/themes";
import { formatRange } from "@/lib/dates";
import { measureNote, sourceLabel, withMethodologyProvenance } from "@/lib/note/assemble";
import { countWords } from "@/lib/wordcount";
import { isCompleteUnredactedReview } from "@/lib/quotes";
import type { ActionIdea, GroupingResult, QuoteRecord, ReviewRow, WeeklyNote } from "@/lib/types";

const ABUSE =
  /\b(fuck|shit|asshole|bitch|bastard|dick|cunt|wtf|idiot|stupid)\b/i;

const TEMPLATE_ACTIONS: Record<ThemeName, ActionIdea> = {
  "App Performance & UX": {
    title: "Stabilise the highest-friction screens.",
    detail: "Audit crashes, slow loads and unclear layouts on the screens named most often in this window.",
  },
  "Investing, Trading & Portfolio": {
    title: "Close gaps in trading and portfolio flows.",
    detail: "Review order, notification and portfolio issues raised in this week's reviews and track delivery of the fixes.",
  },
  "Money Movement & Payments": {
    title: "Reduce payment and transfer failures.",
    detail: "Investigate failed deposits, withdrawals and bank-coverage limits reported in this window.",
  },
  "Support, Account & Verification": {
    title: "Shorten account-access recovery time.",
    detail: "Map KYC, login and support dead-ends named in reviews and set a response-time target for each.",
  },
  "Features, Charges & Offers": {
    title: "Clarify fees and missing-feature requests.",
    detail: "Publish a short list of the most-requested features and explain the main charges users asked about.",
  },
};

const TEMPLATE_SUMMARY: Record<ThemeName, (count: number, share: number) => string> = {
  "App Performance & UX": (count, share) =>
    `${count} reviews (${share.toFixed(1)}%) describe speed, crashes, layout or notification friction.`,
  "Investing, Trading & Portfolio": (count, share) =>
    `${count} reviews (${share.toFixed(1)}%) concern trading, orders, US stocks or portfolio views.`,
  "Money Movement & Payments": (count, share) =>
    `${count} reviews (${share.toFixed(1)}%) report deposits, withdrawals, UPI or bank-transfer issues.`,
  "Support, Account & Verification": (count, share) =>
    `${count} reviews (${share.toFixed(1)}%) cover support, KYC, login or account access.`,
  "Features, Charges & Offers": (count, share) =>
    `${count} reviews (${share.toFixed(1)}%) mention missing features, fees, offers or pricing.`,
};

export function pickEligibleQuotes(
  rows: ReviewRow[],
  theme: ThemeName,
  limit = 8,
): QuoteRecord[] {
  const candidates = rows
    .filter((row) => row.theme === theme)
    .filter((row) =>
      isCompleteUnredactedReview(row.review, row.redactedReview, row.piiChanged),
    )
    .filter((row) => !ABUSE.test(row.review))
    .filter((row) => countWords(row.review) > 0 && countWords(row.review) <= 60)
    .sort((a, b) => a.rating - b.rating || b.review.length - a.review.length)
    .slice(0, limit);

  return candidates.map((row, index) => ({
    id: `q_${theme.slice(0, 3).replace(/\s/g, "")}_${index}`,
    theme,
    text: row.review,
  }));
}

export function buildTemplateNote(
  grouping: GroupingResult,
  earliest: Date,
  latest: Date,
): WeeklyNote {
  const quotes: QuoteRecord[] = [];
  grouping.top3.forEach((themeCount) => {
    const theme = themeCount.theme as ThemeName;
    const picked = pickEligibleQuotes(grouping.rows, theme, 1);
    if (picked[0]) quotes.push(picked[0]);
  });

  const themes = grouping.top3.map((item) => {
    const theme = item.theme as ThemeName;
    return {
      theme,
      summary: TEMPLATE_SUMMARY[theme](item.count, item.share),
      count: item.count,
      share: item.share,
    };
  });

  const actions = grouping.top3.map((item) => TEMPLATE_ACTIONS[item.theme as ThemeName]);
  const methodology = withMethodologyProvenance(
    "Public review exports from Google Play and the App Store were combined for this look-back window. Reviews were grouped into a maximum of five themes. Generic or insufficiently detailed reviews were not forced into a theme. No usernames, emails, IDs, or other PII are included in this pulse.",
    "template",
  );

  const note: WeeklyNote = {
    source: "template",
    sourceLabel: sourceLabel("template"),
    provenanceClause: "Template draft.",
    dateRangeLabel: formatRange(earliest, latest),
    dateRangeLong: formatRange(earliest, latest, true),
    reviewCount: grouping.reviewsAnalysed,
    themes,
    quotes,
    actions,
    methodology,
    wordCount: 0,
    quotesVerified: false,
    piiClear: true,
  };
  note.wordCount = measureNote(note);
  void themeByName;
  return note;
}
