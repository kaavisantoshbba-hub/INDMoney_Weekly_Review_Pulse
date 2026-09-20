export function ProgressBar({
  value,
  tone = "accent",
}: {
  value: number;
  tone?: "accent" | "warning";
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-1.5 overflow-hidden rounded-[3px] bg-surface-3"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div
        className="progress-fill h-full rounded-[3px]"
        style={{
          width: `${width}%`,
          background:
            tone === "warning"
              ? "var(--warning)"
              : "linear-gradient(90deg, var(--accent), var(--accent-strong))",
        }}
      />
    </div>
  );
}
