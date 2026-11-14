"use client";

/** Last-resort boundary for failures in the root layout. Self-contained: no app styles or components. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f0f9ff", margin: 0, padding: "15vh 16px", color: "#0b2545" }}>
        <main style={{ maxWidth: 420, margin: "0 auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }} role="alert">
          <h1 style={{ fontSize: 20, margin: 0 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#334155" }}>The application could not load. Please try again in a moment.</p>
          {error.digest && <p style={{ fontSize: 12, color: "#475569" }}>Reference: {error.digest}</p>}
          <button type="button" onClick={reset} style={{ background: "#0b2545", color: "#fff", border: 0, borderRadius: 6, padding: "8px 16px", fontSize: 14, fontWeight: 600 }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
