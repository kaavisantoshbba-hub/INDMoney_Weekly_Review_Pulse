"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { ThemeOrUnclassified } from "@/config/themes";
import { parseReviewsCsv, parseReviewsFromFile, BUNDLED_DATASET_NAME } from "@/lib/csv";
import { applyAiAssignments, applyRuleBasedGrouping, applyValidatedGrouping } from "@/lib/grouping/group";
import { emailFileText, emailFromNote } from "@/lib/email";
import { measureNote, noteContainsPii, sourceLabel, verifyNoteQuotes } from "@/lib/note/assemble";
import { countWords, WORD_LIMIT } from "@/lib/wordcount";
import { buildTemplateNote, pickEligibleQuotes } from "@/lib/note/template";
import { buildValidatedNote } from "@/lib/note/validated";
import validated from "../../../data/reference/validated_current_week.json";
import type {
  AiStatus,
  EmailDraft,
  GroupingResult,
  ImportResult,
  QuoteRecord,
  StepId,
  WeeklyNote,
} from "@/lib/types";

const STEPS: StepId[] = ["import", "group", "generate", "email"];

type FileSource = { name: string; size: number; buffer: ArrayBuffer };

type State = {
  step: StepId;
  lookbackWeeks: number;
  importing: boolean;
  grouping: boolean;
  generating: boolean;
  groupProgress: number;
  lastSource: FileSource | null;
  importResult: ImportResult | null;
  groupingResult: GroupingResult | null;
  note: WeeklyNote | null;
  validatedNote: WeeklyNote | null;
  email: EmailDraft | null;
  toast: string | null;
  clipboardFallback: string | null;
  notice: string | null;
  invalidateMessage: string | null;
  ai: AiStatus;
  promptTemplate: string;
  hoveredTheme: string | null;
};

type Action =
  | { type: "ai"; ai: AiStatus }
  | { type: "prompt"; template: string }
  | { type: "weeks"; weeks: number }
  | { type: "step"; step: StepId }
  | { type: "importing"; value: boolean }
  | { type: "imported"; result: ImportResult; source: FileSource }
  | { type: "grouping"; value: boolean; progress?: number }
  | { type: "grouped"; result: GroupingResult }
  | { type: "generating"; value: boolean }
  | { type: "note"; note: WeeklyNote | null; notice?: string | null }
  | { type: "email"; email: EmailDraft | null }
  | { type: "toast"; message: string | null }
  | { type: "clipboard"; text: string | null }
  | { type: "hover"; theme: string | null }
  | { type: "invalidate"; message: string | null };

const initial: State = {
  step: "import",
  lookbackWeeks: 12,
  importing: false,
  grouping: false,
  generating: false,
  groupProgress: 0,
  lastSource: null,
  importResult: null,
  groupingResult: null,
  note: null,
  validatedNote: null,
  email: null,
  toast: null,
  clipboardFallback: null,
  notice: null,
  invalidateMessage: null,
  ai: { aiConfigured: false, provider: null, model: null },
  promptTemplate: "",
  hoveredTheme: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ai":
      return { ...state, ai: action.ai };
    case "prompt":
      return { ...state, promptTemplate: action.template };
    case "weeks":
      return {
        ...state,
        lookbackWeeks: action.weeks,
        groupingResult: null,
        note: null,
        email: null,
        invalidateMessage: state.importResult
          ? "Look-back window changed. Group and later steps will run again on the updated set."
          : null,
      };
    case "step":
      return { ...state, step: action.step };
    case "importing":
      return { ...state, importing: action.value };
    case "imported":
      return {
        ...state,
        importResult: action.result,
        lastSource: action.source,
        groupingResult: null,
        note: null,
        email: null,
        importing: false,
        invalidateMessage: null,
      };
    case "grouping":
      return {
        ...state,
        grouping: action.value,
        groupProgress: action.progress ?? state.groupProgress,
      };
    case "grouped":
      return {
        ...state,
        groupingResult: action.result,
        grouping: false,
        groupProgress: 1,
        note: null,
        email: null,
      };
    case "generating":
      return { ...state, generating: action.value };
    case "note":
      return { ...state, note: action.note, generating: false, notice: action.notice ?? null };
    case "email":
      return { ...state, email: action.email };
    case "toast":
      return { ...state, toast: action.message };
    case "clipboard":
      return { ...state, clipboardFallback: action.text };
    case "hover":
      return { ...state, hoveredTheme: action.theme };
    case "invalidate":
      return { ...state, invalidateMessage: action.message };
    default:
      return state;
  }
}

function trimProse(text: string, maxWords: number): string {
  const words = text.trim().split(/\\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  if (maxWords <= 1) return words[0] ?? "";
  return `${words.slice(0, maxWords).join(" ").replace(/[.,;:!?]+$/, "")}…`;
}

function fitNoteToWordLimit(note: WeeklyNote): WeeklyNote {
  let fitted: WeeklyNote = {
    ...note,
    themes: note.themes.map((theme) => ({ ...theme })),
    quotes: note.quotes.map((quote) => ({ ...quote })),
    actions: note.actions.map((action) => ({ ...action })),
  };

  const methodologyFallback =
    "Public Google Play and App Store reviews were combined for this look-back window. Reviews were grouped into up to five themes. Quotes were verified against imported reviews. No PII is included.";

  if (measureNote(fitted) > WORD_LIMIT) {
    fitted = {
      ...fitted,
      methodology: methodologyFallback,
    };
  }

  const fields: Array<{
    get: () => string;
    set: (value: string) => void;
    minWords: number;
  }> = [
    {
      get: () => fitted.methodology,
      set: (value) => {
        fitted = { ...fitted, methodology: value };
      },
      minWords: 8,
    },
    ...fitted.themes.map((_, index) => ({
      get: () => fitted.themes[index]?.summary ?? "",
      set: (value: string) => {
        fitted = {
          ...fitted,
          themes: fitted.themes.map((theme, i) =>
            i === index ? { ...theme, summary: value } : theme,
          ),
        };
      },
      minWords: 8,
    })),
    ...fitted.actions.map((_, index) => ({
      get: () => fitted.actions[index]?.detail ?? "",
      set: (value: string) => {
        fitted = {
          ...fitted,
          actions: fitted.actions.map((action, i) =>
            i === index ? { ...action, detail: value } : action,
          ),
        };
      },
      minWords: 6,
    })),
  ];

  while (measureNote(fitted) > WORD_LIMIT) {
    const excess = measureNote(fitted) - WORD_LIMIT;

    let candidate = fields
      .map((field) => ({
        field,
        words: countWords(field.get()),
      }))
      .filter(({ field, words }) => words > field.minWords)
      .sort((a, b) => b.words - a.words)[0];

    if (!candidate) break;

    const remove = Math.min(
      Math.max(1, excess),
      Math.max(1, candidate.words - candidate.field.minWords),
      12,
    );

    candidate.field.set(
      trimProse(candidate.field.get(), candidate.words - remove),
    );
  }

  return fitted;
}

function finaliseNote(note: WeeklyNote, reviews: string[]): WeeklyNote {
  const fitted = fitNoteToWordLimit(note);
  const verified = verifyNoteQuotes(fitted, reviews);

  return {
    ...fitted,
    wordCount: measureNote(fitted),
    quotesVerified: verified.ok,
    piiClear: !noteContainsPii(fitted),
  };
}

const WorkflowContext = createContext<{
  state: State;
  goTo: (step: StepId) => void;
  setWeeks: (weeks: number) => void;
  importFile: (file: File) => Promise<void>;
  loadBundled: () => Promise<void>;
  runGrouping: () => Promise<void>;
  generateNote: () => Promise<void>;
  restoreValidated: () => void;
  copyText: (text: string, toast: string) => Promise<void>;
  printNote: () => void;
  downloadEmail: () => void;
  setHover: (theme: string | null) => void;
  clearToast: () => void;
  continueIfReady: (from: StepId) => void;
} | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((ai: AiStatus) => dispatch({ type: "ai", ai }))
      .catch(() => undefined);
    fetch("/api/prompt")
      .then((res) => res.json())
      .then((data: { template: string }) => dispatch({ type: "prompt", template: data.template }))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (state.step === "group" && state.importResult && !state.groupingResult && !state.grouping) {
      void runGroupingInternal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.importResult, state.lookbackWeeks]);

  const goTo = useCallback((step: StepId) => {
    dispatch({ type: "step", step });
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      document.getElementById("step-title")?.focus();
    }, 50);
  }, []);

  const setWeeks = useCallback(
    async (weeks: number) => {
      dispatch({ type: "weeks", weeks });
      if (!state.lastSource) return;
      dispatch({ type: "importing", value: true });
      const result = await parseReviewsCsv(
        state.lastSource,
        weeks,
        validated.fingerprint,
      );
      dispatch({ type: "imported", result, source: state.lastSource });
    },
    [state.lastSource],
  );

  async function ingest(name: string, size: number, buffer: ArrayBuffer) {
    dispatch({ type: "importing", value: true });
    const started = performance.now();
    const result = await parseReviewsCsv(
      { name, size, buffer },
      state.lookbackWeeks,
      validated.fingerprint,
    );
    const elapsed = performance.now() - started;
    if (elapsed < 150) {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    dispatch({ type: "imported", result, source: { name, size, buffer } });
  }

  const importFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    await ingest(file.name, file.size, buffer);
  }, [state.lookbackWeeks]);

  const loadBundled = useCallback(async () => {
    const response = await fetch("/data/INDMoney_Reviews_Clean.csv");
    const buffer = await response.arrayBuffer();
    await ingest(BUNDLED_DATASET_NAME, buffer.byteLength, buffer);
  }, [state.lookbackWeeks]);

  async function runGroupingInternal() {
    const imported = state.importResult;
    if (!imported || imported.fatalError || imported.rows.length === 0) return;
    dispatch({ type: "grouping", value: true, progress: 0.05 });

    if (imported.isValidatedCurrent && state.lookbackWeeks === 12) {
      dispatch({ type: "grouped", result: applyValidatedGrouping(imported.rows) });
      return;
    }

    if (state.ai.aiConfigured) {
      const labels: ThemeOrUnclassified[] = new Array(imported.rows.length).fill("Unclassified");
      const batchSize = 100;
      const batches = Math.ceil(imported.rows.length / batchSize);
      try {
        for (let i = 0; i < batches; i += 1) {
          const slice = imported.rows.slice(i * batchSize, (i + 1) * batchSize);
          const response = await fetch("/api/group", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              reviews: slice.map((row, index) => ({
                index,
                text: row.redactedReview.slice(0, 500),
              })),
            }),
          });
          if (!response.ok) throw new Error("group failed");
          const data = (await response.json()) as { labels: Record<string, ThemeOrUnclassified> };
          slice.forEach((_, index) => {
            labels[i * batchSize + index] = data.labels[String(index)] ?? "Unclassified";
          });
          dispatch({ type: "grouping", value: true, progress: (i + 1) / batches });
        }
        const result = applyAiAssignments(imported.rows, labels);
        result.label = `AI-assisted grouping · ${state.ai.provider ?? "llm"}`;
        dispatch({ type: "grouped", result });
        return;
      } catch {
        dispatch({
          type: "toast",
          message: "AI grouping isn't available right now. Using rule-based grouping.",
        });
      }
    }

    const started = performance.now();
    const result = applyRuleBasedGrouping(imported.rows);
    const wait = 150 - (performance.now() - started);
    if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
    dispatch({ type: "grouped", result });
  }

  const runGrouping = useCallback(async () => {
    await runGroupingInternal();
  }, [state.importResult, state.ai, state.lookbackWeeks]);

  const generateNote = useCallback(async () => {
    const imported = state.importResult;
    const grouping = state.groupingResult;
    if (!imported || !grouping) return;
    dispatch({ type: "generating", value: true });
    const reviews = imported.rows.map((row) => row.redactedReview);
    const started = performance.now();

    const finish = (note: WeeklyNote, notice?: string | null) => {
      const ready = finaliseNote(note, reviews);
      dispatch({ type: "note", note: ready, notice });
      if (ready.quotesVerified) {
        dispatch({
          type: "email",
          email: emailFromNote(ready, imported.isValidatedCurrent && state.lookbackWeeks === 12),
        });
      } else {
        dispatch({ type: "email", email: null });
      }
    };

    if (imported.isValidatedCurrent && state.lookbackWeeks === 12 && !state.ai.aiConfigured) {
      const note = buildValidatedNote();
      const wait = 150 - (performance.now() - started);
      if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
      finish(note);
      return;
    }

    if (imported.isValidatedCurrent && state.lookbackWeeks === 12 && state.ai.aiConfigured) {
      const validatedNote = buildValidatedNote();
      try {
        const response = await fetch("/api/generate-note", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dateRange: validatedNote.dateRangeLabel,
            reviewCount: validatedNote.reviewCount,
            topThemes: validatedNote.themes.map((theme) => ({
              theme: theme.theme,
              count: theme.count,
              share: theme.share,
            })),
            pinnedQuotes: validatedNote.quotes,
            candidates: [],
            proseWordBudget: 80,
            methodologyBase: validated.methodology,
            mode: "validated_ai",
          }),
        });
        if (!response.ok) throw new Error("generate failed");
        const data = (await response.json()) as {
          theme_summaries: Array<{ theme: string; summary: string }>;
          actions: Array<{ title: string; detail: string }>;
        };
        const note: WeeklyNote = {
          ...validatedNote,
          source: "ai",
          sourceLabel: sourceLabel("ai", state.ai.provider, state.ai.model),
          provenanceClause: "Drafted with AI assistance.",
          themes: validatedNote.themes.map((theme, index) => ({
            ...theme,
            summary: data.theme_summaries[index]?.summary ?? theme.summary,
          })),
          actions: validatedNote.actions.map((action, index) => ({
            title: action.title,
            detail: data.actions[index]?.detail ?? action.detail,
          })),
          methodology: `${validated.methodology} Drafted with AI assistance.`,
        };
        finish(note);
        return;
      } catch {
        finish(validatedNote, "AI generation isn't available right now. The validated note is shown.");
        return;
      }
    }

    if (state.ai.aiConfigured) {
      const candidates: QuoteRecord[] = grouping.top3.flatMap((theme) =>
        pickEligibleQuotes(grouping.rows, theme.theme as QuoteRecord["theme"], 8),
      );
      try {
        const response = await fetch("/api/generate-note", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dateRange: `${imported.earliestDate.toDateString()}`,
            reviewCount: grouping.reviewsAnalysed,
            topThemes: grouping.top3.map((theme) => ({
              theme: theme.theme,
              count: theme.count,
              share: theme.share,
            })),
            candidates,
            pinnedQuotes: [],
            proseWordBudget: 80,
            mode: "full",
          }),
        });
        if (!response.ok) throw new Error("generate failed");
        const data = (await response.json()) as {
          theme_summaries: Array<{ theme: string; summary: string }>;
          quotes: QuoteRecord[];
          actions: Array<{ title: string; detail: string }>;
        };
        const note: WeeklyNote = {
          source: "ai",
          sourceLabel: sourceLabel("ai", state.ai.provider, state.ai.model),
          provenanceClause: "Drafted with AI assistance.",
          dateRangeLabel: formatImportedRange(imported),
          dateRangeLong: formatImportedRange(imported, true),
          reviewCount: grouping.reviewsAnalysed,
          themes: grouping.top3.map((item, index) => ({
            theme: item.theme as QuoteRecord["theme"],
            summary: data.theme_summaries[index]?.summary ?? "",
            count: item.count,
            share: item.share,
          })),
          quotes: data.quotes,
          actions: data.actions,
          methodology:
            "Public review exports from Google Play and the App Store were combined for this look-back window. Reviews were grouped into a maximum of five themes. Generic or insufficiently detailed reviews were not forced into a theme. No usernames, emails, IDs, or other PII are included in this pulse. Drafted with AI assistance.",
          wordCount: 0,
          quotesVerified: false,
          piiClear: true,
        };
        finish(note);
        return;
      } catch {
        const template = buildTemplateNote(grouping, imported.earliestDate, imported.latestDate);
        finish(template, "AI generation isn't available right now. A template draft is shown.");
        return;
      }
    }

    const template = buildTemplateNote(grouping, imported.earliestDate, imported.latestDate);
    const wait = 150 - (performance.now() - started);
    if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
    finish(template);
  }, [state.importResult, state.groupingResult, state.ai, state.lookbackWeeks]);

  const restoreValidated = useCallback(() => {
    const imported = state.importResult;
    if (!imported?.isValidatedCurrent) return;
    const note = finaliseNote(
      buildValidatedNote(),
      imported.rows.map((row) => row.redactedReview),
    );
    dispatch({ type: "note", note });
    dispatch({
      type: "email",
      email: emailFromNote(note, true),
    });
  }, [state.importResult]);

  const copyText = useCallback(async (text: string, toast: string) => {
    try {
      await navigator.clipboard.writeText(text);
      dispatch({ type: "toast", message: toast });
      dispatch({ type: "clipboard", text: null });
    } catch {
      dispatch({ type: "clipboard", text });
    }
  }, []);

  const printNote = useCallback(() => {
    window.print();
    dispatch({ type: "toast", message: "Use your browser print dialog to save as PDF." });
  }, []);

  const downloadEmail = useCallback(() => {
    if (!state.email) return;
    const text = emailFileText(state.email);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "INDMoney_Weekly_Pulse_Email_Draft.txt";
    link.click();
    URL.revokeObjectURL(url);
    dispatch({ type: "toast", message: "Email draft downloaded." });
  }, [state.email]);

  const continueIfReady = useCallback(
    (from: StepId) => {
      if (from === "import" && (!state.importResult || state.importResult.fatalError || !state.importResult.rows.length)) {
        return;
      }
      if (from === "group" && !state.groupingResult) return;
      if (from === "generate" && !state.note?.quotesVerified) return;
      const index = STEPS.indexOf(from);
      const next = STEPS[index + 1];
      if (next) goTo(next);
    },
    [goTo, state.importResult, state.groupingResult, state.note],
  );

  const value = useMemo(
    () => ({
      state,
      goTo,
      setWeeks: (weeks: number) => {
        void setWeeks(weeks);
      },
      importFile,
      loadBundled,
      runGrouping,
      generateNote,
      restoreValidated,
      copyText,
      printNote,
      downloadEmail,
      setHover: (theme: string | null) => dispatch({ type: "hover", theme }),
      clearToast: () => dispatch({ type: "toast", message: null }),
      continueIfReady,
    }),
    [
      state,
      goTo,
      setWeeks,
      importFile,
      loadBundled,
      runGrouping,
      generateNote,
      restoreValidated,
      copyText,
      printNote,
      downloadEmail,
      continueIfReady,
    ],
  );

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("workflow");
  return ctx;
}

function formatImportedRange(imported: ImportResult, long = false) {
  const start = imported.earliestDate;
  const end = imported.latestDate;
  const monthsShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthsLong = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const months = long ? monthsLong : monthsShort;
  return `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
}

export { STEPS };
export type { StepId };
