import { THEMES, THEME_ORDER, type ThemeName, type ThemeOrUnclassified } from "@/config/themes";
import { classifyReview } from "@/lib/grouping/rules";
import { shareOf } from "@/lib/share";
import type { GroupingResult, ReviewRow, ThemeCount } from "@/lib/types";
import validated from "../../../data/reference/validated_current_week.json";

export function countsFromAssignments(
  rows: ReviewRow[],
  assignments: ThemeOrUnclassified[],
): ThemeCount[] {
  const tally = new Map<ThemeOrUnclassified, number>();
  THEMES.forEach((theme) => tally.set(theme.name, 0));
  tally.set("Unclassified", 0);
  assignments.forEach((theme) => {
    tally.set(theme, (tally.get(theme) ?? 0) + 1);
  });
  const total = rows.length;
  return [...tally.entries()]
    .map(([theme, count]) => ({
      theme,
      count,
      share: shareOf(count, total),
    }))
    .sort((a, b) => THEME_ORDER[a.theme] - THEME_ORDER[b.theme]);
}

export function top3FromCounts(counts: ThemeCount[]): ThemeCount[] {
  return counts
    .filter((item) => item.theme !== "Unclassified")
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return THEME_ORDER[a.theme] - THEME_ORDER[b.theme];
    })
    .slice(0, 3);
}

export function applyRuleBasedGrouping(rows: ReviewRow[]): GroupingResult {
  const assigned = rows.map((row) => {
    const theme = classifyReview(`${row.redactedTitle} ${row.redactedReview}`);
    return { ...row, theme };
  });
  const counts = countsFromAssignments(assigned, assigned.map((row) => row.theme ?? "Unclassified"));
  return {
    mode: "rules",
    label: "Rule-based grouping — approximate. Add an API key for AI-assisted grouping.",
    counts,
    top3: top3FromCounts(counts),
    reviewsAnalysed: assigned.length,
    rows: assigned,
  };
}

export function applyValidatedGrouping(rows: ReviewRow[]): GroupingResult {
  const total = validated.reviewCount;
  const counts: ThemeCount[] = [
    ...validated.themes.map((theme) => ({
      theme: theme.name as ThemeName,
      count: theme.reviews,
      share: theme.share,
    })),
    {
      theme: "Unclassified",
      count: validated.unclassified.reviews,
      share: validated.unclassified.share,
    },
  ];
  return {
    mode: "validated",
    label: "Validated reference — completed on this exact dataset",
    counts,
    top3: top3FromCounts(counts),
    reviewsAnalysed: total,
    rows,
  };
}

export function applyAiAssignments(
  rows: ReviewRow[],
  labels: ThemeOrUnclassified[],
): GroupingResult {
  const assigned = rows.map((row, index) => ({
    ...row,
    theme: labels[index] ?? "Unclassified",
  }));
  const counts = countsFromAssignments(assigned, assigned.map((row) => row.theme ?? "Unclassified"));
  return {
    mode: "ai",
    label: "AI-assisted grouping",
    counts,
    top3: top3FromCounts(counts),
    reviewsAnalysed: assigned.length,
    rows: assigned,
  };
}
