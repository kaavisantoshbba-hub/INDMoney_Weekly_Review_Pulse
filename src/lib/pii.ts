import type { PiiCategory, PiiCounts } from "@/lib/types";

export const PII_TOKENS = [
  "[email]",
  "[link]",
  "[handle]",
  "[phone]",
  "[id]",
] as const;

const EMPTY_COUNTS = (): PiiCounts => ({
  email: 0,
  link: 0,
  handle: 0,
  phone: 0,
  id: 0,
});

function sumCounts(target: PiiCounts, add: PiiCounts) {
  (Object.keys(add) as PiiCategory[]).forEach((key) => {
    target[key] += add[key];
  });
}

function protectTokens(text: string): { text: string; tokens: string[] } {
  const tokens: string[] = [];
  const next = text.replace(/\[(email|link|handle|phone|id)\]/gi, (match) => {
    tokens.push(match.toLowerCase());
    return `\u0000${tokens.length - 1}\u0000`;
  });
  return { text: next, tokens };
}

function restoreTokens(text: string, tokens: string[]): string {
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)] ?? "");
}

function looksLikeMoneyContext(source: string, index: number): boolean {
  const before = source.slice(Math.max(0, index - 12), index);
  const after = source.slice(index, Math.min(source.length, index + 18));
  return /(?:₹|rs\.?|inr|usd|\$)\s*$/i.test(before) || /%\s*$/.test(before) || /^(?:\s*(?:rs|inr|%))/i.test(after);
}

function redactOnce(input: string): { text: string; counts: PiiCounts } {
  const counts = EMPTY_COUNTS();
  const protectedText = protectTokens(input);
  let work = protectedText.text;

  work = work.replace(/\bhttps?:\/\/[^\s<>"']+/gi, () => {
    counts.link += 1;
    return "[link]";
  });
  work = work.replace(/\bwww\.[^\s<>"']+/gi, () => {
    counts.link += 1;
    return "[link]";
  });

  work = work.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    () => {
      counts.email += 1;
      return "[email]";
    },
  );

  work = work.replace(
    /\b[A-Za-z0-9._-]{2,}@(?:oksbi|okhdfcbank|okicici|okaxis|paytm|ybl|apl|ibl|upi|axl|ibl)\b/gi,
    () => {
      counts.handle += 1;
      return "[handle]";
    },
  );

  work = work.replace(/(^|[^A-Za-z0-9])@([A-Za-z0-9_]{2,30})\b/g, (match, prefix) => {
    counts.handle += 1;
    return `${prefix}[handle]`;
  });

  work = work.replace(/\b(?:X{3,}|\*{3,}|x{3,})[A-Za-z0-9]{2,}\b/g, () => {
    counts.id += 1;
    return "[id]";
  });

  work = work.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, () => {
    counts.id += 1;
    return "[id]";
  });

  work = work.replace(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, () => {
    counts.id += 1;
    return "[id]";
  });

  work = work.replace(
    /(?:\+91[\s-]?|91[\s-]?|0[\s-]?)?[6-9]\d(?:[\s-]?\d){8}\b/g,
    (match, offset, source: string) => {
      const digits = match.replace(/\D/g, "");
      if (digits.length < 10) return match;
      if (looksLikeMoneyContext(source, Number(offset))) return match;
      counts.phone += 1;
      return "[phone]";
    },
  );

  work = work.replace(/\b\d{10,15}\b/g, (match, offset, source: string) => {
    if (looksLikeMoneyContext(source, Number(offset))) return match;
    counts.phone += 1;
    return "[phone]";
  });

  work = work.replace(
    /\b(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{12,}\b/g,
    (match) => {
      if (/^\d+$/.test(match)) return match;
      if (PII_TOKENS.includes(match as (typeof PII_TOKENS)[number])) return match;
      counts.id += 1;
      return "[id]";
    },
  );

  return {
    text: restoreTokens(work, protectedText.tokens),
    counts,
  };
}

export function redactPii(text: string): { text: string; counts: PiiCounts; changed: boolean } {
  const first = redactOnce(text);
  const second = redactOnce(first.text);
  return {
    text: second.text,
    counts: first.counts,
    changed: second.text !== text,
  };
}

export function mergePiiCounts(parts: PiiCounts[]): PiiCounts {
  const total = EMPTY_COUNTS();
  parts.forEach((part) => sumCounts(total, part));
  return total;
}

export function totalPii(counts: PiiCounts): number {
  return counts.email + counts.link + counts.handle + counts.phone + counts.id;
}

export function containsPiiPattern(text: string): boolean {
  const result = redactPii(text);
  return result.changed;
}

export function emptyPiiCounts(): PiiCounts {
  return EMPTY_COUNTS();
}
