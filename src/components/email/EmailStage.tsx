"use client";

import { ArrowLeft, Copy, Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { emailFileText } from "@/lib/email";
import { useWorkflow } from "@/lib/workflow/WorkflowProvider";

export function EmailStage() {
  const { state, copyText, goTo, downloadEmail } = useWorkflow();
  const draft = state.email;
  const preview = draft ? emailFileText(draft) : "";

  return (
    <section className="no-print mx-auto w-full max-w-[820px] step-in">
      <p className="eyebrow">04 · Draft Email</p>
      <h1
        id="step-title"
        tabIndex={-1}
        className="mt-3 font-serif text-[30px] leading-9 font-medium tracking-[-0.01em] md:text-[40px] md:leading-[46px]"
      >
        Draft email
      </h1>
      <p className="mt-3 text-text-2">Ready to paste into your mail client. Nothing has been sent.</p>

      {draft ? (
        <article className="mt-10 overflow-hidden rounded-[var(--r-card)] border border-border bg-surface-1 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <Chip tone="warning" icon={<Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />}>
              Draft — Not Sent
            </Chip>
          </div>
          <div className="grid grid-cols-[72px_1fr] gap-y-2 px-6 py-4 text-sm">
            <span className="text-text-3">To</span>
            <span>{draft.to}</span>
            <span className="text-text-3">Subject</span>
            <span>{draft.subject}</span>
          </div>
          <div className="border-t border-border-subtle px-6 py-5">
            <pre className="whitespace-pre-wrap rounded-[var(--r-card)] bg-surface-2 p-5 text-[14.5px] leading-6 text-text-1">
              {draft.body}
            </pre>
          </div>
        </article>
      ) : (
        <p className="mt-10 text-sm text-text-2">Generate a verified note before drafting the email.</p>
      )}

      <div className="sticky-cta mt-8 flex flex-wrap items-center gap-3">
        <Button
          iconLeft={<Copy className="h-5 w-5" strokeWidth={1.5} />}
          disabled={!draft}
          disabledReason={!draft ? "Generate a verified note first." : undefined}
          onClick={() => {
            if (preview) void copyText(preview, "Email copied to clipboard");
          }}
        >
          Copy email
        </Button>
        <Button
          variant="secondary"
          iconLeft={<Download className="h-5 w-5" strokeWidth={1.5} />}
          disabled={!draft}
          disabledReason={!draft ? "Generate a verified note first." : undefined}
          onClick={downloadEmail}
        >
          Download TXT
        </Button>
        <Button variant="ghost" iconLeft={<ArrowLeft className="h-5 w-5" strokeWidth={1.5} />} onClick={() => goTo("generate")}>
          Back to Pulse
        </Button>
      </div>
    </section>
  );
}
