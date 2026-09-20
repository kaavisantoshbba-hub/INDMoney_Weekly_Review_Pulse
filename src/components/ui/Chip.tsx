import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export function Chip({
  children,
  tone = "neutral",
  dot,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
}) {
  const tones: Record<Tone, string> = {
    neutral: "bg-surface-2 text-text-2 border-border",
    accent: "bg-accent-soft text-accent border-transparent",
    success: "bg-[rgba(63,203,142,0.12)] text-success border-transparent",
    warning: "bg-[rgba(232,176,74,0.14)] text-warning border-transparent",
    danger: "bg-[rgba(240,113,107,0.14)] text-danger border-transparent",
  };
  return (
    <span
      className={`inline-flex h-[26px] items-center gap-1.5 rounded-[var(--r-chip)] border px-2.5 text-[12.5px] leading-[26px] ${tones[tone]}`}
    >
      {dot ? (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background:
              tone === "success"
                ? "var(--success)"
                : tone === "warning"
                  ? "var(--warning)"
                  : tone === "accent"
                    ? "var(--accent)"
                    : "var(--text-3)",
          }}
        />
      ) : null}
      {icon}
      {children}
    </span>
  );
}
