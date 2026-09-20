"use client";

import { Check } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { STEPS, useWorkflow, type StepId } from "@/lib/workflow/WorkflowProvider";

const LABELS: Record<StepId, string> = {
  import: "Import",
  group: "Group",
  generate: "Generate",
  email: "Draft Email",
};

export function Stepper() {
  const { state, goTo } = useWorkflow();
  const currentIndex = STEPS.indexOf(state.step);
  const unlocked = unlockMap(state);

  return (
    <nav
      aria-label="Workflow"
      className="glass-bar no-print sticky top-16 z-20 h-14 border-t-0"
    >
      <div className="mx-auto flex h-full max-w-[1180px] items-center px-4 md:px-8">
        <p className="md:hidden text-sm text-text-2">
          Step {currentIndex + 1} of 4 · {LABELS[state.step]}
        </p>
        <ol className="ml-auto flex items-center gap-2 md:hidden">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  index <= currentIndex ? "var(--accent)" : "var(--surface-3)",
              }}
            />
          ))}
        </ol>
        <ol className="relative hidden w-full items-center md:flex">
          <span
            className="pointer-events-none absolute left-[14px] right-[14px] top-1/2 h-px -translate-y-1/2 bg-border"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute left-[14px] top-1/2 h-px -translate-y-1/2"
            style={{
              width: `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - 14px)`,
              background: "var(--accent)",
              transition: "width 400ms var(--ease-out)",
            }}
            aria-hidden
          />
          {STEPS.map((step, index) => {
          const importOk = Boolean(state.importResult && !state.importResult.fatalError);
          const groupOk = Boolean(state.groupingResult);
          const noteOk = Boolean(state.note?.quotesVerified);
          const current = step === state.step;
          const complete =
            (step === "import" && importOk && !current) ||
            (step === "group" && groupOk && !current) ||
            (step === "generate" && noteOk && !current);
                       const locked = !unlocked[step] && !current;
            const node = (
              <button
                type="button"
                disabled={locked}
                aria-current={current ? "step" : undefined}
                onClick={() => {
                  if (!locked) goTo(step);
                }}
                className={`relative z-10 flex items-center gap-3 bg-bg-1 pr-3 disabled:cursor-not-allowed ${
                  locked ? "text-text-3" : "text-text-2"
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-semibold ${
                    current
                      ? "text-accent"
                      : complete
                        ? "text-accent"
                        : "text-text-3"
                  }`}
                  style={
                    current
                      ? {
                          boxShadow: "0 0 0 1px var(--accent), 0 0 12px var(--accent-ring)",
                          background: "var(--bg-1)",
                        }
                      : complete
                        ? { background: "var(--accent-soft)" }
                        : {
                            boxShadow: "inset 0 0 0 1px var(--border-strong)",
                            background: "var(--bg-1)",
                          }
                  }
                >
                  {complete ? <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> : `0${index + 1}`}
                </span>
                <span className={`hidden text-sm lg:inline ${current ? "text-text-1" : ""}`}>
                  {LABELS[step]}
                </span>
              </button>
            );
            return (
              <li key={step} className="flex flex-1 items-center last:flex-none">
                {locked ? (
                  <Tooltip label={`Complete ${LABELS[STEPS[index - 1]]} first`}>
                    {node}
                  </Tooltip>
                ) : (
                  node
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function unlockMap(state: {
  importResult: { fatalError: unknown; rows: unknown[] } | null;
  groupingResult: unknown;
  note: { quotesVerified: boolean } | null;
}) {
  const importOk = Boolean(state.importResult && !state.importResult.fatalError && state.importResult.rows.length);
  const groupOk = Boolean(state.groupingResult);
  const noteOk = Boolean(state.note?.quotesVerified);
  return {
    import: true,
    group: importOk,
    generate: groupOk,
    email: noteOk,
  } as Record<StepId, boolean>;
}
