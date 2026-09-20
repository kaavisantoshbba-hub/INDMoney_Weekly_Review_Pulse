"use client";

import { useEffect, useState } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ControlRail } from "@/components/pulse/ControlRail";
import { NoteSheet } from "@/components/pulse/NoteSheet";
import { useWorkflow } from "@/lib/workflow/WorkflowProvider";

export function GenerateStage() {
  const { state, generateNote } = useWorkflow();
  const [showBusy, setShowBusy] = useState(false);

  useEffect(() => {
    if (!state.generating) {
      setShowBusy(false);
      return;
    }
    const id = window.setTimeout(() => setShowBusy(true), 150);
    return () => window.clearTimeout(id);
  }, [state.generating]);

  return (
    <section className="step-in">
      <div className="no-print">
      <h1
        id="step-title"
        tabIndex={-1}
        className="mt-3 font-serif text-[30px] leading-9 font-medium tracking-[-0.01em] md:text-[40px] md:leading-[46px]"
      >
        Weekly Pulse
      </h1>
      <p className="mt-3 max-w-[720px] text-text-2">
        One page, 250 words or fewer. Quotes are verified against the source reviews.
      </p>

      {state.notice ? (
        <div className="mt-6 max-w-[720px]">
          <Banner
            tone="warning"
            title="AI generation isn't available right now"
            actions={
              <Button variant="secondary" onClick={() => void generateNote()}>
                Try again
              </Button>
            }
          >
            {state.notice}
          </Banner>
        </div>
      ) : null}

      {state.note && !state.note.quotesVerified ? (
        <div className="mt-6 max-w-[720px]">
          <Banner
            tone="error"
            title="A quote couldn't be verified"
            actions={
              <Button variant="secondary" onClick={() => void generateNote()}>
                Regenerate
              </Button>
            }
          >
            The note is blocked until each quote matches a full review in the imported file.
          </Banner>
        </div>
      ) : null}
      </div>

      <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
        <NoteSheet
          note={state.note?.quotesVerified ? state.note : null}
          generating={showBusy}
        />
        <ControlRail />
      </div>
    </section>
  );
}
