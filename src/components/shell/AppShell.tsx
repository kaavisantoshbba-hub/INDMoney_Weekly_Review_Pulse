"use client";

import { EmailStage } from "@/components/email/EmailStage";
import { GroupStage } from "@/components/group/GroupStage";
import { ImportStage } from "@/components/import/ImportStage";
import { GenerateStage } from "@/components/pulse/GenerateStage";
import { Footer, Header } from "@/components/shell/Header";
import { Stepper } from "@/components/shell/Stepper";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { useWorkflow } from "@/lib/workflow/WorkflowProvider";

export function AppShell() {
  const { state, clearToast } = useWorkflow();

  return (
    <div className="min-h-screen">
      <Header />
      <Stepper />
      <main className="mx-auto min-h-[70vh] max-w-[1180px] px-4 pb-24 pt-12 md:px-8">
        {state.step === "import" ? <ImportStage /> : null}
        {state.step === "group" ? <GroupStage /> : null}
        {state.step === "generate" ? <GenerateStage /> : null}
        {state.step === "email" ? <EmailStage /> : null}
      </main>
      <Footer />
      <Toast message={state.toast} onDone={clearToast} />
      {state.clipboardFallback ? (
        <div className="no-print fixed inset-x-4 bottom-20 z-50 mx-auto max-w-xl">
          <Banner
            tone="warning"
            title="Couldn't copy automatically"
            actions={
              <Button
                variant="secondary"
                onClick={() => {
                  const area = document.getElementById("clipboard-fallback") as HTMLTextAreaElement | null;
                  area?.select();
                }}
              >
                Select all
              </Button>
            }
          >
            <textarea
              id="clipboard-fallback"
              className="mt-2 h-32 w-full rounded-[var(--r-btn)] border border-border bg-surface-2 p-3 text-sm"
              readOnly
              value={state.clipboardFallback}
            />
          </Banner>
        </div>
      ) : null}
    </div>
  );
}
