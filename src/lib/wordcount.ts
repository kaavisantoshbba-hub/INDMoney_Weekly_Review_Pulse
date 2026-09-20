/** Count whitespace-separated tokens that contain at least one letter or digit. */
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text
    .split(/\s+/)
    .filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

export const WORD_LIMIT = 250;
