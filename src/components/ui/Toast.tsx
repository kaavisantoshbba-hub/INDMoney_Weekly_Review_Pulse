"use client";

import { useEffect } from "react";

export function Toast({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDone, 2400);
    return () => window.clearTimeout(id);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      className="no-print pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[var(--r-card)] border border-border px-4 py-2.5 text-sm text-text-1 shadow-[var(--shadow-card)]"
      style={{
        background: "color-mix(in srgb, var(--surface-1) 72%, transparent)",
        backdropFilter: "blur(12px)",
        animation: "toast-in 200ms var(--ease-out)",
      }}
      aria-live="polite"
    >
      {message}
    </div>
  );
}
