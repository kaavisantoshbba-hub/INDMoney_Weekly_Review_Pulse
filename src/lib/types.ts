import type { ThemeName, ThemeOrUnclassified } from "@/config/themes";

export type Platform = "Google Play" | "App Store";

export type StepId = "import" | "group" | "generate" | "email";

export type PiiCategory = "email" | "link" | "handle" | "phone" | "id";

export type PiiCounts = Record<PiiCategory, number>;

export type ReviewRow = {
  platform: Platform;
  dateRaw: string;
  date: Date;
  rating: number;
  title: string;
  review: string;
  redactedReview: string;
  redactedTitle: string;
  piiChanged: boolean;
  piiCounts: PiiCounts;
  theme?: ThemeOrUnclassified;
};

export type ImportIssueCode =
  | "wrong_type"
  | "malformed"
  | "missing_columns"
  | "invalid_dates"
  | "missing_review_text"
  | "file_too_large"
  | "no_valid_rows"
  | "date_format_help";

export type ImportNotice = {
  code: ImportIssueCode | "extra_columns" | "outside_window" | "short_coverage" | "pii_redacted" | "unrecognised_platform";
  title: string;
  body: string;
  tone: "error" | "warning" | "info" | "success";
};

export type ImportResult = {
  fileName: string;
  fileSize: number;
  rows: ReviewRow[];
  totalParsedRows: number;
  extraColumns: string[];
  missingColumns: string[];
  foundColumns: string[];
  excludedUnrecognisedPlatform: number;
  excludedUnparseableDates: number;
  skippedBlankReview: number;
  excludedOutsideWindow: number;
  excludedInvalidRating: number;
  piiCounts: PiiCounts;
  piiChangedRows: number;
  fingerprint: string;
  isValidatedCurrent: boolean;
  latestDate: Date;
  earliestDate: Date;
  weeksCovered: number;
  lookbackWeeks: number;
  notices: ImportNotice[];
  fatalError: ImportNotice | null;
};

export type ThemeCount = {
  theme: ThemeOrUnclassified;
  count: number;
  share: number;
};

export type GroupingMode = "validated" | "ai" | "rules";

export type GroupingResult = {
  mode: GroupingMode;
  label: string;
  counts: ThemeCount[];
  top3: ThemeCount[];
  reviewsAnalysed: number;
  rows: ReviewRow[];
};

export type QuoteRecord = {
  id: string;
  theme: ThemeName;
  text: string;
};

export type ActionIdea = {
  title: string;
  detail: string;
};

export type ThemeSummary = {
  theme: ThemeName;
  summary: string;
};

export type NoteSource = "validated" | "ai" | "template";

export type WeeklyNote = {
  source: NoteSource;
  sourceLabel: string;
  provenanceClause: string | null;
  dateRangeLabel: string;
  dateRangeLong: string;
  reviewCount: number;
  themes: Array<ThemeSummary & { count: number; share: number }>;
  quotes: QuoteRecord[];
  actions: ActionIdea[];
  methodology: string;
  wordCount: number;
  quotesVerified: boolean;
  piiClear: boolean;
};

export type EmailDraft = {
  to: string;
  subject: string;
  body: string;
};

export type AiStatus = {
  aiConfigured: boolean;
  provider: string | null;
  model: string | null;
};
