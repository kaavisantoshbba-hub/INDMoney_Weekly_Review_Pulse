import { WORD_LIMIT } from "@/lib/wordcount";
import type { WeeklyNote } from "@/lib/types";

export function NoteSheet({
  note,
  generating,
}: {
  note: WeeklyNote | null;
  generating: boolean;
}) {
  return (
    <article
      id="note-sheet"
      className="print-body mx-auto w-full max-w-[720px] rounded-[var(--r-sheet)] bg-paper px-6 py-8 text-ink-1 shadow-[var(--shadow-sheet)] md:px-12 md:py-11"
    >
      {generating && !note ? <NoteSkeleton /> : null}
      {!generating && !note ? (
        <p className="py-24 text-center text-sm text-ink-3">Your note will appear here</p>
      ) : null}
      {note ? <NoteBody note={note} /> : null}
      <span className="sr-only">
        Word limit {WORD_LIMIT}
      </span>
    </article>
  );
}

function NoteBody({ note }: { note: WeeklyNote }) {
  return (
    <div>
      <header className="flex items-start justify-between gap-4 border-b border-paper-rule pb-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.04em] text-ink-1">INDMoney</p>
          <p className="text-[11px] text-ink-3">Weekly Review Pulse</p>
        </div>
        <div className="text-right text-[11px] text-ink-3">
          <p>{note.dateRangeLabel}</p>
          <p>{note.reviewCount.toLocaleString("en-IN")} reviews</p>
        </div>
      </header>
      <h2 className="mt-6 font-serif text-[28px] leading-[34px] font-medium tracking-[-0.01em] text-ink-1">
        INDMoney — Weekly Review Pulse
      </h2>

      <SectionLabel>Top 3 themes</SectionLabel>
      <ol className="stagger mt-3 space-y-4">
        {note.themes.map((theme, index) => (
          <li key={theme.theme}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="font-serif text-[22px] leading-7 text-paper-accent">{index + 1}</span>
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-1">{theme.theme}</p>
                  <p className="mt-1 text-[12.5px] leading-5 text-ink-2">{theme.summary}</p>
                </div>
              </div>
              <p className="shrink-0 text-right text-[12.5px] tabular text-ink-2">
                {theme.count} · {theme.share.toFixed(1)}%
              </p>
            </div>
            <div className="mt-2 h-[3px] bg-paper-accent" />
          </li>
        ))}
      </ol>

      <SectionLabel>Real user voice</SectionLabel>
      <ul className="mt-3 space-y-4">
        {note.quotes.map((quote) => (
          <li
            key={quote.id}
            className="border-l-2 pl-3"
            style={{ borderColor: "var(--paper-accent)" }}
          >
            <p className="font-serif text-[15px] leading-[23px] text-ink-1">
              <span aria-hidden>“</span>
              <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{quote.text}</span>
              <span aria-hidden>”</span>
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-ink-3">{quote.theme}</p>
          </li>
        ))}
      </ul>

      <SectionLabel>Recommended actions</SectionLabel>
      <ol className="mt-3 space-y-3">
        {note.actions.map((action, index) => (
          <li key={action.title} className="text-[12.5px] leading-5 text-ink-2">
            <span className="font-semibold text-ink-1">
              {index + 1}. {action.title}
            </span>{" "}
            {action.detail}
          </li>
        ))}
      </ol>

      <SectionLabel>Methodology</SectionLabel>
      <p className="mt-3 text-[10.5px] leading-4 text-ink-3">{note.methodology}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mt-7 border-t border-paper-rule pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-paper-accent">
      {children}
    </p>
  );
}

function NoteSkeleton() {
  return (
    <div aria-hidden className="space-y-4">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton h-8 w-72" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-24 w-full" />
      <p className="text-center text-sm text-ink-3">Drafting your note…</p>
    </div>
  );
}
