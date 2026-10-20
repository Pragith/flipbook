import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePdfUrl, pdfUrlTitle, pdfFetchUrl } from "../src/pdf-source.ts";
test("accepts explicit HTTP(S) documents, including signed URLs", () => {
  assert.equal(
    parsePdfUrl(" https://example.com/a.pdf?token=x "),
    "https://example.com/a.pdf?token=x",
  );
  assert.equal(
    parsePdfUrl("http://localhost:5173/book.pdf"),
    "http://localhost:5173/book.pdf",
  );
});
test("rejects script, local file, incomplete and credential-bearing URLs", () => {
  for (const value of [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "/relative.pdf",
    "https://a:b@example.com/book.pdf",
    "data:application/pdf,test",
    "",
  ])
    assert.throws(() => parsePdfUrl(value));
});
test("Archive download links use the first-party browser endpoint only", () => {
  assert.equal(
    pdfFetchUrl(
      "https://archive.org/download/Assorted_Mags_Docs_Ebooks/Popular-Mechanics-2011-03.pdf",
    ),
    "https://archive.org/cors/Assorted_Mags_Docs_Ebooks/Popular-Mechanics-2011-03.pdf",
  );
  for (const value of [
    "https://example.com/book.pdf",
    "blob:http://localhost/id",
    "/book.pdf",
    "https://archive.org.evil.example/download/book.pdf",
  ])
    assert.equal(pdfFetchUrl(value), value);
});
test("display title excludes query credentials and decodes the filename", () => {
  assert.equal(
    pdfUrlTitle("https://example.com/An%20Example-Book.pdf?secret=123"),
    "An Example Book",
  );
});
