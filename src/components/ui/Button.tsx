"use client";

import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  disabledReason?: string;
};

export function Button({
  variant = "primary",
  iconLeft,
  iconRight,
  loading,
  disabledReason,
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const base =
    "relative inline-flex h-11 items-center justify-center gap-2 rounded-[var(--r-btn)] px-5 text-sm font-semibold transition-[transform,background,border-color,box-shadow,color,opacity] duration-[var(--dur-fast)] ease-[var(--ease-in-out)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40";
  const variants: Record<Variant, string> = {
    primary:
      "text-on-accent shadow-none hover:enabled:-translate-y-px hover:enabled:shadow-[var(--shadow-glow)] active:enabled:translate-y-0 active:enabled:scale-[0.985]",
    secondary:
      "bg-surface-2 text-text-1 border border-border hover:enabled:bg-surface-3 hover:enabled:border-border-strong active:enabled:scale-[0.985]",
    ghost:
      "bg-transparent text-text-2 px-3 hover:enabled:text-text-1",
  };

  return (
    <span className="inline-flex flex-col items-stretch">
      <button
        className={`${base} ${variants[variant]} ${className}`}
        style={
          variant === "primary"
            ? { background: "linear-gradient(180deg, var(--accent), var(--accent-strong))" }
            : undefined
        }
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-describedby={isDisabled && disabledReason ? rest.id ? `${rest.id}-why` : undefined : undefined}
        title={isDisabled && disabledReason ? disabledReason : rest.title}
        {...rest}
      >
        <span className={`inline-flex items-center gap-2 ${loading ? "invisible" : ""}`}>
          {iconLeft}
          {children}
          {iconRight}
        </span>
        {loading ? (
          <span className="absolute inset-0 inline-flex items-center justify-center">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
            <span className="sr-only">Working</span>
          </span>
        ) : null}
      </button>
      {isDisabled && disabledReason ? (
        <span
          id={rest.id ? `${rest.id}-why` : undefined}
          className="mt-1 text-[12.5px] leading-5 text-text-3"
        >
          {disabledReason}
        </span>
      ) : null}
    </span>
  );
}
