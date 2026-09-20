"use client";

import AppErrorBoundary from "@/components/ErrorBoundary";
import { AppShell } from "@/components/shell/AppShell";
import { WorkflowProvider } from "@/lib/workflow/WorkflowProvider";

export default function HomePage() {
  return (
    <WorkflowProvider>
      <AppErrorBoundary>
        <AppShell />
      </AppErrorBoundary>
    </WorkflowProvider>
  );
}
