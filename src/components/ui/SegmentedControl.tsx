"use client";

export function SegmentedControl({
  value,
  options,
  onChange,
  label,
}: {
  value: number;
  options: number[];
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex h-9 items-center rounded-[var(--r-btn)] border border-border bg-surface-2 p-0.5"
      onKeyDown={(event) => {
        const index = options.indexOf(value);
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          onChange(options[Math.min(options.length - 1, index + 1)]);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          onChange(options[Math.max(0, index - 1)]);
        }
      }}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`relative h-8 min-w-11 rounded-[8px] px-3 text-sm font-medium transition-colors duration-[var(--dur-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selected ? "bg-surface-3 text-text-1" : "text-text-3 hover:text-text-1"
            }`}
            onClick={() => onChange(option)}
          >
            {option}
            {selected ? (
              <span
                className="absolute inset-x-2 bottom-0.5 h-px"
                style={{ background: "var(--accent)" }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
