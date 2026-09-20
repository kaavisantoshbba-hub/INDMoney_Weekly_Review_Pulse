"use client";

import { useId, useState, type ReactNode } from "react";

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex"
      >
        {children}
      </span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-[var(--r-chip)] border border-border bg-surface-2 px-2.5 py-1.5 text-[12.5px] leading-5 text-text-1 shadow-[var(--shadow-card)]"
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
