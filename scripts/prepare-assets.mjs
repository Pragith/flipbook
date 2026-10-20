import { cp, mkdir, rm } from "node:fs/promises";
await mkdir("public", { recursive: true });
// Remove legacy generated demo copies; the release uses the original sample only.
await rm("public/demo_book", { recursive: true, force: true });
await cp("assets/sample.pdf", "public/book.pdf");
for (const folder of ["cmaps", "standard_fonts", "wasm"])
  await cp(`node_modules/pdfjs-dist/${folder}`, `public/${folder}`, {
    recursive: true,
  });
