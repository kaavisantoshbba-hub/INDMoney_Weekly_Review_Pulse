import Papa from "papaparse";
import { parseReviewDate } from "@/lib/dates";
import { fingerprintRows } from "@/lib/fingerprint";
import { emptyPiiCounts, mergePiiCounts, redactPii, totalPii } from "@/lib/pii";
import { applyLookbackWindow } from "@/lib/window";
import type {
  ImportNotice,
  ImportResult,
  Platform,
  ReviewRow,
} from "@/lib/types";

const REQUIRED = ["platform", "date", "rating", "title", "review"] as const;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 50_000;

export const BUNDLED_DATASET_PATH = "/data/INDMoney_Reviews_Clean.csv";
export const BUNDLED_DATASET_NAME = "INDMoney_Reviews_Clean.csv";

function decodeUtf8(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}

function normaliseHeader(header: string): string {
  return header.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function normalisePlatform(value: string): Platform | null {
  const text = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (
    text === "google play" ||
    text === "play store" ||
    text === "android" ||
    text === "googleplay"
  ) {
    return "Google Play";
  }
  if (
    text === "app store" ||
    text === "ios" ||
    text === "apple" ||
    text === "appstore" ||
    text === "itunes"
  ) {
    return "App Store";
  }
  return null;
}

function notice(
  code: ImportNotice["code"],
  title: string,
  body: string,
  tone: ImportNotice["tone"],
): ImportNotice {
  return { code, title, body, tone };
}

export async function parseReviewsCsv(
  source: { name: string; size: number; buffer: ArrayBuffer },
  lookbackWeeks: number,
  validatedFingerprint: string,
): Promise<ImportResult> {
  const base = emptyResult(source.name, source.size, lookbackWeeks);

  if (!source.name.toLowerCase().endsWith(".csv")) {
    base.fatalError = notice(
      "wrong_type",
      "That doesn't look like a CSV",
      "Choose a .csv export with the columns Platform, Date, Rating, Title and Review.",
      "error",
    );
    return base;
  }

  if (source.size > MAX_BYTES) {
    base.fatalError = notice(
      "file_too_large",
      "That file is too large",
      "Use a file of 10 MB or fewer, with at most 50,000 rows.",
      "error",
    );
    return base;
  }

  const text = decodeUtf8(source.buffer);
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  if (parsed.errors.some((error) => error.type === "Quotes" || error.type === "FieldMismatch" && error.code === "UndetectableDelimiter")) {
    base.fatalError = notice(
      "malformed",
      "We couldn't read that file",
      "It may be damaged or not comma-separated. Try re-exporting it as UTF-8 CSV.",
      "error",
    );
    return base;
  }

  if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
    base.fatalError = notice(
      "malformed",
      "We couldn't read that file",
      "It may be damaged or not comma-separated. Try re-exporting it as UTF-8 CSV.",
      "error",
    );
    return base;
  }

  const originalFields = parsed.meta.fields;
  const fieldMap = new Map<string, string>();
  originalFields.forEach((field) => {
    fieldMap.set(normaliseHeader(field), field);
  });

  const missing = REQUIRED.filter((column) => !fieldMap.has(column));
  const found = originalFields.map((field) => field.trim()).filter(Boolean);
  base.foundColumns = found;
  base.missingColumns = missing.map(
    (column) => column.charAt(0).toUpperCase() + column.slice(1),
  );

  if (missing.length > 0) {
    base.fatalError = notice(
      "missing_columns",
      "Some required columns are missing",
      `Missing: ${base.missingColumns.join(", ")}. Found: ${found.join(", ") || "none"}.`,
      "error",
    );
    return base;
  }

  const extra = originalFields.filter((field) => {
    const key = normaliseHeader(field);
    return key && !REQUIRED.includes(key as (typeof REQUIRED)[number]);
  });
  base.extraColumns = extra;
  if (extra.length > 0) {
    base.notices.push(
      notice(
        "extra_columns",
        "Extra columns ignored",
        "Only Platform, Date, Rating, Title and Review were kept. Other columns were dropped and are not stored.",
        "info",
      ),
    );
  }

  if (parsed.data.length > MAX_ROWS) {
    base.fatalError = notice(
      "file_too_large",
      "That file is too large",
      "Use a file of 10 MB or fewer, with at most 50,000 rows.",
      "error",
    );
    return base;
  }

  base.totalParsedRows = parsed.data.length;

  const rows: ReviewRow[] = [];
  let unrecognisedPlatform = 0;
  let badDates = 0;
  let blankReview = 0;
  let badRating = 0;

  for (const record of parsed.data) {
    const platformRaw = record[fieldMap.get("platform")!] ?? "";
    const dateRaw = record[fieldMap.get("date")!] ?? "";
    const ratingRaw = record[fieldMap.get("rating")!] ?? "";
    const title = record[fieldMap.get("title")!] ?? "";
    const review = record[fieldMap.get("review")!] ?? "";

    if (!String(review).trim()) {
      blankReview += 1;
      continue;
    }

    const platform = normalisePlatform(String(platformRaw));
    if (!platform) {
      unrecognisedPlatform += 1;
      continue;
    }

    const date = parseReviewDate(String(dateRaw));
    if (!date) {
      badDates += 1;
      continue;
    }

    const rating = Number.parseInt(String(ratingRaw).trim(), 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      badRating += 1;
      continue;
    }

    const reviewRedaction = redactPii(String(review));
    const titleRedaction = redactPii(String(title));

    rows.push({
      platform,
      dateRaw: String(dateRaw),
      date,
      rating,
      title: String(title),
      review: String(review),
      redactedReview: reviewRedaction.text,
      redactedTitle: titleRedaction.text,
      piiChanged: reviewRedaction.changed || titleRedaction.changed,
      piiCounts: mergePiiCounts([reviewRedaction.counts, titleRedaction.counts]),
    });
  }

  base.excludedUnrecognisedPlatform = unrecognisedPlatform;
  base.excludedUnparseableDates = badDates;
  base.skippedBlankReview = blankReview;
  base.excludedInvalidRating = badRating;

  if (unrecognisedPlatform > 0) {
    base.notices.push(
      notice(
        "unrecognised_platform",
        "Some platforms were not recognised",
        `${unrecognisedPlatform} row${unrecognisedPlatform === 1 ? " was" : "s were"} excluded because the platform was not Google Play or App Store.`,
        "warning",
      ),
    );
  }

  if (blankReview > 0) {
    base.notices.push(
      notice(
        "missing_review_text",
        "Some rows had no review text",
        `${blankReview} row${blankReview === 1 ? " was" : "s were"} skipped because the review was blank.`,
        rows.length === 0 ? "error" : "warning",
      ),
    );
  }

  if (badDates > 0) {
    const mostFailed = base.totalParsedRows > 0 && badDates / base.totalParsedRows > 0.5;
    const dateNotice = notice(
      mostFailed ? "date_format_help" : "invalid_dates",
      mostFailed ? "Most dates couldn't be read" : "Some dates couldn't be read",
      `${badDates} row${badDates === 1 ? " was" : "s were"} excluded. Dates should be day-first (dd-mm-yyyy hh:mm:ss) or ISO 8601. Slash dates such as mm/dd/yyyy are not accepted.`,
      mostFailed && rows.length === 0 ? "error" : "warning",
    );
    base.notices.push(dateNotice);
    if (mostFailed && rows.length === 0) {
      base.fatalError = dateNotice;
      return base;
    }
  }

  if (rows.length === 0) {
    base.fatalError = notice(
      "no_valid_rows",
      "We couldn't use that file",
      "No valid reviews remained after reading the file. Check the columns, dates and review text, then try again.",
      "error",
    );
    return base;
  }

  const windowed = applyLookbackWindow(rows, lookbackWeeks);
  base.excludedOutsideWindow = windowed.excluded;
  base.rows = windowed.kept;
  base.latestDate = windowed.end!;
  base.earliestDate = windowed.kept.length
    ? windowed.kept.reduce((min, row) => (row.date < min ? row.date : min), windowed.kept[0].date)
    : windowed.end!;
  base.weeksCovered = windowed.coverageWeeks;

  if (windowed.excluded > 0) {
    base.notices.push(
      notice(
        "outside_window",
        "Some reviews fall outside the look-back window",
        `${windowed.excluded} review${windowed.excluded === 1 ? "" : "s"} sat outside the last ${lookbackWeeks} weeks and ${windowed.excluded === 1 ? "was" : "were"} excluded.`,
        "info",
      ),
    );
  }

  if (windowed.coverageWeeks < 8) {
    base.notices.push(
      notice(
        "short_coverage",
        "This file covers fewer than 8 weeks",
        `The dates in this file span about ${windowed.coverageWeeks.toFixed(1)} weeks. A weekly pulse usually uses 8–12 weeks of reviews.`,
        "warning",
      ),
    );
  }

  if (base.rows.length === 0) {
    base.fatalError = notice(
      "no_valid_rows",
      "We couldn't use that file",
      "No reviews remain inside the selected look-back window. Try a longer window or a different export.",
      "error",
    );
    return base;
  }

  base.piiCounts = mergePiiCounts(base.rows.map((row) => row.piiCounts));
  base.piiChangedRows = base.rows.filter((row) => row.piiChanged).length;
  if (base.piiChangedRows > 0 && totalPii(base.piiCounts) > 0) {
    const parts = (Object.entries(base.piiCounts) as [string, number][])
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${count} ${key}`);
    base.notices.push(
      notice(
        "pii_redacted",
        "PII redactions applied",
        `Identifiers were replaced before grouping. Counts by category: ${parts.join(", ")}.`,
        "warning",
      ),
    );
  }

  base.fingerprint = await fingerprintRows(
    [...rows].sort((a, b) => a.date.getTime() - b.date.getTime()),
  );
  // Fingerprint over all valid parsed rows (pre-window) so a matching file is recognised
  // even if the user shortens the look-back. Validated grouping still uses the windowed set.
  base.fingerprint = await fingerprintRows(sortForFingerprint(rows));
  base.isValidatedCurrent = base.fingerprint === validatedFingerprint;

  return base;
}

function sortForFingerprint(rows: ReviewRow[]): ReviewRow[] {
  return [...rows].sort((a, b) => {
    const date = a.dateRaw.localeCompare(b.dateRaw);
    if (date !== 0) return date;
    return a.review.localeCompare(b.review);
  });
}

function emptyResult(fileName: string, fileSize: number, lookbackWeeks: number): ImportResult {
  const now = new Date();
  return {
    fileName,
    fileSize,
    rows: [],
    totalParsedRows: 0,
    extraColumns: [],
    missingColumns: [],
    foundColumns: [],
    excludedUnrecognisedPlatform: 0,
    excludedUnparseableDates: 0,
    skippedBlankReview: 0,
    excludedOutsideWindow: 0,
    excludedInvalidRating: 0,
    piiCounts: emptyPiiCounts(),
    piiChangedRows: 0,
    fingerprint: "",
    isValidatedCurrent: false,
    latestDate: now,
    earliestDate: now,
    weeksCovered: 0,
    lookbackWeeks,
    notices: [],
    fatalError: null,
  };
}

export async function parseReviewsFromFile(
  file: File,
  lookbackWeeks: number,
  validatedFingerprint: string,
): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  return parseReviewsCsv(
    { name: file.name, size: file.size, buffer },
    lookbackWeeks,
    validatedFingerprint,
  );
}

export async function parseReviewsFromText(
  name: string,
  text: string,
  lookbackWeeks: number,
  validatedFingerprint: string,
): Promise<ImportResult> {
  const buffer = new TextEncoder().encode(text).buffer;
  return parseReviewsCsv(
    { name, size: buffer.byteLength, buffer },
    lookbackWeeks,
    validatedFingerprint,
  );
}
