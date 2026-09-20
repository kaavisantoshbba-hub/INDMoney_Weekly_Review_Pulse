"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WORD_LIMIT } from "@/lib/wordcount";
import { noteToPlainText } from "@/lib/note/plain";
import { useWorkflow } from "@/lib/workflow/WorkflowProvider";

export function ControlRail() {
  const { state, generateNote, restoreValidated, copyText, printNote, continueIfReady } =
    useWorkflow();
  const [open, setOpen] = useState(false);
  const note = state.note;
  const hasNote = Boolean(note?.quotesVerified);
  const ratio = note ? note.wordCount / WORD_LIMIT : 0;
  const tone = ratio >= 0.9 ? "warning" : "accent";

  return (
    <aside className="no-print h-fit w-full rounded-[var(--r-card)] border border-border bg-surface-1 p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-32 lg:w-[320px] xl:w-[320px] min-[1024px]:w-[300px] min-[1280px]:w-[320px]">
      {note ? (
        <Chip tone={note.source === "ai" ? "accent" : note.source === "template" ? "warning" : "success"} dot>
          {note.sourceLabel}
        </Chip>
      ) : (
        <Chip tone="neutral" dot>
          Waiting to generate
        </Chip>
      )}

      <div className="mt-6">
        <p className="font-serif text-[32px] leading-9 tabular">
          {note ? note.wordCount : 0} / {WORD_LIMIT}{" "}
          <span className="text-lg text-text-3">words</span>
        </p>
        <div className="mt-3">
          <ProgressBar value={ratio * 100} tone={tone} />
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-text-2">
        <li className="flex items-center gap-2">
          <Check className={`h-[18px] w-[18px] ${note?.quotesVerified ? "text-success" : "text-text-3"}`} />
          Quotes verified against source reviews
        </li>
        <li className="flex items-center gap-2">
          <Check className={`h-[18px] w-[18px] ${note && note.wordCount <= WORD_LIMIT ? "text-success" : "text-text-3"}`} />
          Within 250 words
        </li>
        <li className="flex items-center gap-2">
          <Check className={`h-[18px] w-[18px] ${note?.piiClear ? "text-success" : "text-text-3"}`} />
          PII check passed
        </li>
      </ul>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant={hasNote ? "secondary" : "primary"}
          loading={state.generating}
          onClick={() => void generateNote()}
        >
          {hasNote ? "Regenerate" : "Generate"}
        </Button>
        <Button
          variant="secondary"
          iconLeft={<Copy className="h-5 w-5" strokeWidth={1.5} />}
          disabled={!hasNote}
          disabledReason={!hasNote ? "Generate a verified note first." : undefined}
          onClick={() => {
            if (note) void copyText(noteToPlainText(note), "Note copied to clipboard");
          }}
        >
          Copy
        </Button>
        <Button
          variant="secondary"
          iconLeft={<Printer className="h-5 w-5" strokeWidth={1.5} />}
          disabled={!hasNote}
          disabledReason={!hasNote ? "Generate a verified note first." : undefined}
          onClick={printNote}
        >
          Print / Save PDF
        </Button>
        {state.importResult?.isValidatedCurrent && note?.source === "ai" ? (
          <Button
            variant="ghost"
            iconLeft={<RotateCcw className="h-5 w-5" strokeWidth={1.5} />}
            onClick={restoreValidated}
          >
            Restore validated note
          </Button>
        ) : null}
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-sm font-semibold text-text-1"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          AI instructions
          <ChevronDown
            className="h-[18px] w-[18px] transition-transform duration-[var(--dur-base)]"
            style={{ transform: open ? "rotate(180deg)" : undefined }}
          />
        </button>
        <div className={`accordion-grid ${open ? "open" : ""}`}>
          <div>
            <p className="mt-3 text-[12.5px] leading-5 text-text-3">
              Edit `prompts/weekly_pulse_prompt.txt` to change behaviour
            </p>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-[var(--r-card)] bg-surface-2 p-3 text-[12px] leading-5 text-text-2">
              {state.promptTemplate || "Loading instructions…"}
            </pre>
          </div>
        </div>
        <div className="mt-3">
          <Chip tone="accent">Professional · product management</Chip>
        </div>
      </div>

      <div className="mt-8">
        <Button
          disabled={!hasNote}
          disabledReason={!hasNote ? "Generate a verified note first." : undefined}
          onClick={() => continueIfReady("generate")}
          iconRight={<span aria-hidden>→</span>}
        >
          Continue to Draft Email
        </Button>
      </div>
    </aside>
  );
}
