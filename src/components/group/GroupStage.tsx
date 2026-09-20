"use client";

import { useEffect, useState } from "react";
import { THEMES } from "@/config/themes";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCount } from "@/lib/share";
import { themeByName, type ThemeName } from "@/config/themes";
import { useWorkflow } from "@/lib/workflow/WorkflowProvider";

export function GroupStage() {
  const { state, continueIfReady, goTo, setHover } = useWorkflow();
  const grouping = state.groupingResult;
  const [showBusy, setShowBusy] = useState(false);

  useEffect(() => {
    if (!state.grouping) {
      setShowBusy(false);
      return;
    }
    const id = window.setTimeout(() => setShowBusy(true), 150);
    return () => window.clearTimeout(id);
  }, [state.grouping]);

  const top3 = grouping?.top3 ?? [];
  const rest = grouping?.counts.filter(
    (item) => item.theme !== "Unclassified" && !top3.some((top) => top.theme === item.theme),
  ) ?? [];
  const unclassified = grouping?.counts.find((item) => item.theme === "Unclassified");
  const maxThemeCount = Math.max(
    1,
    ...(grouping?.counts.filter((item) => item.theme !== "Unclassified").map((item) => item.count) ?? [1]),
  );

  return (
    <section className="no-print step-in">
      <p className="eyebrow">02 · Group</p>
      <h1
        id="step-title"
        tabIndex={-1}
        className="mt-3 font-serif text-[30px] leading-9 font-medium tracking-[-0.01em] md:text-[40px] md:leading-[46px]"
      >
        Group reviews into themes
      </h1>
      <p className="mt-3 max-w-[720px] text-text-2">
        Each review belongs to at most one of five themes. Generic reviews stay unclassified.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {showBusy && !grouping ? (
            <p className="mb-6 text-sm text-text-2">Grouping reviews…</p>
          ) : null}
          {showBusy ? (
            <div className="mb-8">
              <ProgressBar value={state.groupProgress * 100} />
            </div>
          ) : null}

          {grouping ? (
            <>
              <DistributionBar
                counts={grouping.counts}
                hovered={state.hoveredTheme}
                onHover={setHover}
              />
              <div className="mt-8 space-y-4">
                {top3.map((item, index) => {
                  const theme = item.theme as ThemeName;
                  return (
                    <article
                      key={item.theme}
                      className="rounded-[var(--r-card)] border border-border bg-surface-1 p-7 shadow-[var(--shadow-card)] transition-colors duration-[var(--dur-fast)]"
                      style={{
                        borderColor:
                          state.hoveredTheme === item.theme ? "var(--border-strong)" : undefined,
                        background:
                          state.hoveredTheme === item.theme ? "var(--surface-2)" : undefined,
                      }}
                      onMouseEnter={() => setHover(item.theme)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-serif text-[32px] leading-9 text-accent">{index + 1}</p>
                          <h3 className="mt-2 text-base font-semibold">{item.theme}</h3>
                          <p className="mt-1 text-sm text-text-2">{themeByName(theme).definition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-serif text-[32px] leading-9 tabular">{formatCount(item.count)}</p>
                          <p className="text-sm text-text-2 tabular">{item.share.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="mt-5 h-1.5 overflow-hidden rounded-[3px] bg-surface-3">
                        <div
                          className="progress-fill h-full rounded-[3px]"
                          style={{
                            width: `${(item.count / maxThemeCount) * 100}%`,
                            background: "var(--accent)",
                            opacity: 1 - index * 0.25,
                          }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>

              <p className="mt-10 text-[11.5px] font-medium uppercase tracking-[0.14em] text-text-3">
                Also detected
              </p>
              <div className="mt-3 space-y-3">
                {rest.map((item) => (
                  <article
                    key={item.theme}
                    className="rounded-[var(--r-card)] border border-border bg-surface-1 p-4"
                    onMouseEnter={() => setHover(item.theme)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      borderColor:
                        state.hoveredTheme === item.theme ? "var(--border-strong)" : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold">{item.theme}</h3>
                      <p className="text-sm tabular text-text-2">
                        {formatCount(item.count)} · {item.share.toFixed(1)}%
                      </p>
                    </div>
                    <div className="mt-3 h-1 overflow-hidden rounded-[3px] bg-surface-3">
                      <div
                        className="progress-fill h-full"
                        style={{
                          width: `${(item.count / maxThemeCount) * 100}%`,
                          background: "rgba(165,175,187,0.7)",
                        }}
                      />
                    </div>
                  </article>
                ))}
                {unclassified ? (
                  <article
                    className="rounded-[var(--r-card)] border border-dashed border-border-strong p-4"
                    onMouseEnter={() => setHover("Unclassified")}
                    onMouseLeave={() => setHover(null)}
                  >
                    <p className="text-sm text-text-2">
                      Unclassified · {formatCount(unclassified.count)} · {unclassified.share.toFixed(1)}% — Generic or insufficiently detailed reviews. Not a theme.
                    </p>
                  </article>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <aside className="h-fit rounded-[var(--r-card)] border border-border bg-surface-1 p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-32">
          <p className="text-sm font-semibold text-text-1">{grouping?.label ?? "Preparing grouping…"}</p>
          <p className="mt-4 text-sm text-text-2">
            Reviews analysed {formatCount(grouping?.reviewsAnalysed ?? state.importResult?.rows.length ?? 0)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip>One primary theme per review</Chip>
            <Chip>Maximum 5 themes</Chip>
          </div>
          {grouping?.mode === "ai" ? (
            <p className="mt-4 text-[13px] text-text-3">
              AI grouping sends redacted review text to the configured LLM provider.
            </p>
          ) : null}
          <div className="mt-8 flex flex-col items-stretch gap-3">
            <Button
              disabled={!grouping}
              disabledReason={!grouping ? "Grouping is still running." : undefined}
              onClick={() => continueIfReady("group")}
              iconRight={<span aria-hidden>→</span>}
            >
              Generate Weekly Pulse
            </Button>
            <Button variant="ghost" onClick={() => goTo("import")}>
              Back to Import
            </Button>
          </div>
          <p className="mt-6 text-[12.5px] leading-5 text-text-3">
            {THEMES.length} official themes. Unclassified is shown separately and is not a theme.
          </p>
        </aside>
      </div>
    </section>
  );
}

function DistributionBar({
  counts,
  hovered,
  onHover,
}: {
  counts: Array<{ theme: string; count: number; share: number }>;
  hovered: string | null;
  onHover: (theme: string | null) => void;
}) {
  const total = counts.reduce((sum, item) => sum + item.count, 0) || 1;
  const topNames = counts
    .filter((item) => item.theme !== "Unclassified")
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((item) => item.theme);

  return (
    <div>
      <div className="flex h-2.5 gap-0.5" role="img" aria-label="Theme distribution">
        {counts.map((item) => {
          const isTop = topNames.indexOf(item.theme);
          const color =
            item.theme === "Unclassified"
              ? "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(165,175,187,0.35) 2px, rgba(165,175,187,0.35) 4px)"
              : isTop === 0
                ? "var(--accent)"
                : isTop === 1
                  ? "rgba(60,200,244,0.7)"
                  : isTop === 2
                    ? "rgba(60,200,244,0.45)"
                    : "rgba(125,136,149,0.7)";
          return (
            <button
              key={item.theme}
              type="button"
              className="h-full min-w-[2px] rounded-[1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              style={{
                width: `${(item.count / total) * 100}%`,
                background: color,
                opacity: hovered && hovered !== item.theme ? 0.45 : 1,
                boxShadow: item.theme === "Unclassified" ? "inset 0 0 0 1px rgba(165,175,187,0.5)" : undefined,
              }}
              onMouseEnter={() => onHover(item.theme)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(item.theme)}
              onBlur={() => onHover(null)}
              aria-label={`${item.theme}: ${item.count} (${item.share.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[12.5px] text-text-3">
        {counts.map((item) => (
          <span key={item.theme}>{item.theme}</span>
        ))}
      </div>
    </div>
  );
}
