"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-[720px] px-8 py-24" role="alert">
      <p className="eyebrow">Error</p>
      <h1 className="mt-3 font-serif text-[40px] leading-[46px] font-medium tracking-[-0.01em]">
        Something went wrong
      </h1>
      <p className="mt-3 text-text-2">
        Reload the page to start again. Your last file is not stored on the server.
      </p>
      <button
        className="mt-8 inline-flex h-11 items-center rounded-[var(--r-btn)] px-5 text-sm font-semibold text-on-accent"
        style={{ background: "linear-gradient(180deg, var(--accent), var(--accent-strong))" }}
        onClick={() => reset()}
        type="button"
      >
        Reload
      </button>
    </main>
  );
}
