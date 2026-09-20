"use client";

import { Check, ShieldCheck } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { useWorkflow } from "@/lib/workflow/WorkflowProvider";

export function Header() {
  const { state } = useWorkflow();
  return (
    <header className="glass-bar no-print sticky top-0 z-30 h-16">
      <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold tracking-[0.02em]">INDMoney</span>
          <span className="h-5 w-px bg-border-strong" aria-hidden />
          <span className="text-sm text-text-2">Weekly Review Pulse</span>
        </div>
        {state.ai.aiConfigured ? (
          <Chip tone="success" dot>
            AI ready · {state.ai.provider}
          </Chip>
        ) : (
          <Chip tone="neutral" dot>
            AI not configured — validated output available
          </Chip>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="no-print border-t border-border-subtle py-6 text-center text-[12.5px] text-text-3">
      Built from public review exports. No usernames, emails or IDs are shown or stored.
    </footer>
  );
}

export function Shield({ passed }: { passed: boolean }) {
  return passed ? (
    <ShieldCheck className="h-5 w-5 text-success" aria-hidden />
  ) : (
    <Check className="h-5 w-5 text-warning" aria-hidden />
  );
}
