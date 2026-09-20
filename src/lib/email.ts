import { formatCount } from "@/lib/share";
import { APPROVED_EMAIL } from "@/lib/note/validated";
import type { EmailDraft, WeeklyNote } from "@/lib/types";

export function emailFromNote(note: WeeklyNote, isValidatedCurrent: boolean): EmailDraft {
  if (isValidatedCurrent && note.source === "validated") {
    return {
      to: "Self / Alias",
      subject: APPROVED_EMAIL.subject,
      body: APPROVED_EMAIL.body.endsWith("\n") ? APPROVED_EMAIL.body : `${APPROVED_EMAIL.body}\n`,
    };
  }

  const subject = `INDMoney Weekly Review Pulse: ${note.dateRangeLong}`;
  const themeLines = note.themes
    .map((theme) => `• ${theme.theme} — ${theme.count} reviews · ${theme.share.toFixed(1)}%`)
    .join("\n");
  const quoteLines = note.quotes
    .map((quote) => `• “${quote.text}”`)
    .join("\n\n");
  const actionLines = note.actions
    .map((action, index) => `${index + 1}. ${action.title} ${action.detail}`)
    .join("\n\n");

  const body = [
    "Hi team,",
    "",
    `Sharing the INDMoney Weekly Review Pulse, based on public App Store and Google Play reviews from ${note.dateRangeLong}. We analyzed ${formatCount(note.reviewCount)} reviews in total. The top three themes, user quotes, and recommended actions are summarized below.`,
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
    `Methodology: ${note.methodology}`,
    "Source dataset: public App Store and Google Play review export for this look-back window.",
    "",
    "Please reply with any questions or feedback.",
    "",
    "Best regards,",
    "Kavya",
    "",
  ].join("\n");

  return { to: "Self / Alias", subject, body };
}

export function emailFileText(draft: EmailDraft): string {
  return `Subject: ${draft.subject}\n\n${draft.body}`;
}
