"use client"; // Error boundaries must be Client Components

// Last resort when the root layout itself fails. It replaces the whole document and
// doesn't load the global CSS, so it uses inline styles.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#ffffff",
          color: "#111827",
          textAlign: "center",
        }}
      >
        <title>Something went wrong | BW Tools</title>
        <div style={{ padding: 40 }}>
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "#6b7280", margin: "0 0 8px" }}>The dashboard couldn&apos;t be loaded.</p>
          {digest && (
            <p style={{ color: "#9ca3af", fontSize: 12, fontFamily: "monospace" }}>Error reference: {digest}</p>
          )}
          <button
            onClick={() => retry()}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              border: 0,
              borderRadius: 6,
              background: "#0B1DFF", // brand blue; tokens aren't available here
              color: "#ffffff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
