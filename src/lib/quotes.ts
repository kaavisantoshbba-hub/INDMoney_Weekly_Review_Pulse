export function quotesMatchImportedReviews(
  quotes: string[],
  reviews: string[],
): { ok: boolean; failed: string[] } {
  const failed = quotes.filter((quote) => !reviews.includes(quote));
  return { ok: failed.length === 0, failed };
}

export function isCompleteUnredactedReview(
  review: string,
  redactedReview: string,
  piiChanged: boolean,
): boolean {
  return Boolean(review.trim()) && review === redactedReview && !piiChanged;
}
