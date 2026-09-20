"use client";

import { AlertTriangle, Check } from "lucide-react";
import type { ReactNode } from "react";

export function Banner({
  tone,
  title,
  children,
  actions,
  role,
}: {
  tone: "error" | "warning" | "info" | "success";
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  role?: "alert" | "status";
}) {
  const color =
    tone === "error"
      ? "var(--danger)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "success"
          ? "var(--success)"
          : "var(--accent)";
  return (
    <div
      className="flex gap-3 rounded-[var(--r-card)] border border-border bg-surface-1 p-4"
      style={{ borderLeftWidth: 2, borderLeftColor: color }}
      role={role ?? (tone === "error" ? "alert" : "status")}
    >
      {tone === "success" ? (
        <Check className="mt-0.5 h-[18px] w-[18px] text-success" aria-hidden />
      ) : (
        <AlertTriangle className="mt-0.5 h-[18px] w-[18px]" style={{ color }} aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-1">{title}</p>
        <div className="mt-1 text-sm leading-6 text-text-2">{children}</div>
        {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
