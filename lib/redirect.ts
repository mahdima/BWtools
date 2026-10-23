// A redirect target taken from a URL parameter (e.g. ?next=), limited to paths on this
// site. Anything else ("https://evil.com", "//evil.com", "/\\evil.com") falls back, so
// links we send by email can't be turned into open redirects.
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
