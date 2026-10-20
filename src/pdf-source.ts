/** Public document URLs must be explicit HTTP(S) URLs, never script or credential URLs. */
export function parsePdfUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(
      "Enter a complete PDF URL beginning with https:// or http://.",
    );
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error(
      "Use an HTTP or HTTPS link without a username or password.",
    );
  return url.href;
}
export function pdfUrlTitle(value: string): string {
  try {
    const path = new URL(value).pathname.split("/").pop();
    return decodeURIComponent(path || "PDF document")
      .replace(/\.pdf$/i, "")
      .replace(/[_-]+/g, " ");
  } catch {
    return "PDF document";
  }
}

/** Internet Archive provides this first-party endpoint for cross-origin browser reads. */
export function pdfFetchUrl(value: string): string {
  try {
    const url = new URL(value);
    if (
      ["archive.org", "www.archive.org"].includes(url.hostname) &&
      url.pathname.startsWith("/download/")
    ) {
      url.protocol = "https:";
      url.hostname = "archive.org";
      url.pathname = url.pathname.replace("/download/", "/cors/");
      return url.href;
    }
  } catch {
    /* Local blob or relative asset URL. */
  }
  return value;
}
