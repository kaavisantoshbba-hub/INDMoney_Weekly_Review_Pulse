"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  FileSpreadsheet,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatBytes } from "@/lib/bytes";
import { formatRange } from "@/lib/dates";
import { formatCount } from "@/lib/share";
import { totalPii } from "@/lib/pii";
import { useWorkflow } from "@/lib/workflow/WorkflowProvider";

export function ImportStage() {
  const { state, importFile, loadBundled, setWeeks, continueIfReady } = useWorkflow();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const result = state.importResult;
  const canContinue = Boolean(result && !result.fatalError && result.rows.length > 0);

  useEffect(() => {
    if (!state.importing) {
      setShowReading(false);
      return;
    }
    const id = window.setTimeout(() => setShowReading(true), 150);
    return () => window.clearTimeout(id);
  }, [state.importing]);

  const play = result
    ? result.rows.filter((row) => row.platform === "Google Play").length
    : 0;
  const store = result
    ? result.rows.filter((row) => row.platform === "App Store").length
    : 0;
  const piiPassed = result ? result.piiChangedRows === 0 && totalPii(result.piiCounts) === 0 : false;
  const playShare = play + store > 0 ? (play / (play + store)) * 100 : 0;

  return (
    <section className="no-print mx-auto w-full max-w-[880px] step-in">
      <p className="eyebrow">01 · Import</p>
      <h1
        id="step-title"
        tabIndex={-1}
        className="mt-3 font-serif text-[30px] leading-9 font-medium tracking-[-0.01em] md:text-[40px] md:leading-[46px]"
      >
        Import this week&apos;s reviews
      </h1>
      <p className="mt-3 text-text-2">
        Bring in public App Store and Google Play reviews from the last 8–12 weeks. Your file is read in your browser.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importFile(file);
          event.target.value = "";
        }}
      />

      {!result || result.fatalError ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files[0];
            if (file) void importFile(file);
          }}
          className={`mt-10 flex min-h-[280px] w-full flex-col items-center justify-center rounded-[var(--r-card)] border border-dashed px-6 text-center transition-[border-color,background,transform] duration-[var(--dur-base)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            result?.fatalError ? "border-danger" : "border-border-strong"
          }`}
          style={{
            background: dragOver
              ? "var(--accent-soft)"
              : "radial-gradient(40% 50% at 50% 50%, rgba(60,200,244,0.06), var(--surface-1) 70%)",
            borderColor: dragOver ? "var(--accent)" : undefined,
            transform: dragOver ? "scale(1.005)" : undefined,
          }}
        >
          <span
            className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {showReading ? <Upload className="h-5 w-5" strokeWidth={1.5} /> : <FileSpreadsheet className="h-5 w-5" strokeWidth={1.5} />}
          </span>
          <p className="font-serif text-2xl leading-[30px] text-text-1">
            {showReading
              ? "Reading your file…"
              : dragOver
                ? "Release to import"
                : "Drop your reviews CSV here"}
          </p>
          {!showReading ? (
            <>
              <p className="mt-2 text-sm text-text-3">or</p>
              <span className="mt-3 inline-flex h-11 items-center rounded-[var(--r-btn)] border border-border bg-surface-2 px-5 text-sm font-semibold">
                Browse files
              </span>
              <p className="mt-4 text-[13px] text-text-3">
                CSV · UTF-8 · Platform, Date, Rating, Title, Review · public exports only
              </p>
            </>
          ) : null}
        </button>
      ) : (
        <div className="mt-10 flex items-center justify-between rounded-[var(--r-card)] border border-border bg-surface-1 px-5 py-4 shadow-[var(--shadow-card)]">
          <div className="flex min-w-0 items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-accent" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{result.fileName}</p>
              <p className="text-[13px] text-text-3">{formatBytes(result.fileSize)}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Replace file
          </Button>
        </div>
      )}

      <div className="mt-4">
        <Button variant="ghost" onClick={() => void loadBundled()}>
          Load current week&apos;s dataset
        </Button>
      </div>

      {result?.fatalError ? (
        <div className="mt-6">
          <Banner tone="error" title={result.fatalError.title} role="alert">
            {result.fatalError.body}
          </Banner>
        </div>
      ) : null}

      {result && !result.fatalError
        ? result.notices.map((notice) => (
            <div key={notice.code} className="mt-4">
              <Banner tone={notice.tone} title={notice.title}>
                {notice.body}
              </Banner>
            </div>
          ))
        : null}

      {state.invalidateMessage ? (
        <div className="mt-4">
          <Banner tone="info" title="Look-back window updated">
            {state.invalidateMessage}
          </Banner>
        </div>
      ) : null}

      {result && !result.fatalError && result.rows.length > 0 ? (
        <>
          <div className="stagger mt-10 grid grid-cols-2 gap-4">
            <StatTile label="Reviews">
              <p className="font-serif text-[36px] leading-10 tabular">{formatCount(result.rows.length)}</p>
            </StatTile>
            <StatTile label="Platforms">
              <p className="text-sm text-text-1">
                Google Play {formatCount(play)} · App Store {formatCount(store)}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-[3px] bg-surface-3">
                <div className="flex h-full">
                  <span style={{ width: `${playShare}%`, background: "var(--accent)" }} />
                  <span style={{ width: `${100 - playShare}%`, background: "rgba(60,200,244,0.35)" }} />
                </div>
              </div>
            </StatTile>
            <StatTile label="Date range">
              <p className="font-serif text-[28px] leading-9">{formatRange(result.earliestDate, result.latestDate)}</p>
              <p className="mt-1 text-sm text-text-3">{result.lookbackWeeks} weeks</p>
            </StatTile>
            <StatTile label="Privacy">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`h-5 w-5 ${piiPassed ? "text-success" : "text-warning"}`} />
                <p className="text-sm font-semibold">
                  {piiPassed ? "PII check passed" : "PII redactions applied"}
                </p>
              </div>
              {!piiPassed ? (
                <p className="mt-2 text-[13px] text-text-3">
                  {Object.entries(result.piiCounts)
                    .filter(([, count]) => count > 0)
                    .map(([key, count]) => `${count} ${key}`)
                    .join(", ")}
                </p>
              ) : null}
            </StatTile>
          </div>

          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <ul className="stagger space-y-2 text-sm text-text-2">
              <CheckLine ok={result.missingColumns.length === 0}>5 columns detected</CheckLine>
              <CheckLine ok={result.excludedUnparseableDates === 0}>Dates valid</CheckLine>
              <CheckLine ok={result.excludedOutsideWindow === 0}>
                Reviews within the last {result.lookbackWeeks} weeks
              </CheckLine>
              <CheckLine ok={piiPassed}>PII check passed</CheckLine>
            </ul>
            <div>
              <p className="mb-2 text-[13px] text-text-3">Look-back window (weeks)</p>
              <SegmentedControl
                label="Look-back window in weeks"
                value={state.lookbackWeeks}
                options={[8, 9, 10, 11, 12]}
                onChange={setWeeks}
              />
              {result.excludedOutsideWindow > 0 ? (
                <p className="mt-2 text-[13px] text-text-3">
                  {formatCount(result.excludedOutsideWindow)} rows outside the selected window
                </p>
              ) : (
                <p className="mt-2 text-[13px] text-text-3">0 rows outside the selected window</p>
              )}
            </div>
          </div>

          <p className="mt-8 text-sm font-medium text-accent">Ready to analyze</p>
        </>
      ) : null}

      <div className="sticky-cta mt-10 flex justify-end">
        <Button
          iconRight={<span aria-hidden>→</span>}
          disabled={!canContinue}
          disabledReason={!canContinue ? "Import a valid CSV to continue." : undefined}
          onClick={() => continueIfReady("import")}
        >
          Continue to Group
        </Button>
      </div>
    </section>
  );
}

function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--r-card)] border border-border bg-surface-1 p-6 shadow-[var(--shadow-card)] md:p-7">
      <p className="text-[13px] text-text-3">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CheckLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Check className={`h-[18px] w-[18px] ${ok ? "text-success" : "text-warning"}`} strokeWidth={1.5} />
      {children}
    </li>
  );
}
