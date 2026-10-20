import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const pkg = JSON.parse(await readFile("package.json", "utf8"));
assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
assert.deepEqual(
  await readFile("dist/book.pdf"),
  await readFile("assets/sample.pdf"),
  "Release must contain only the original public sample",
);
await mkdir("release", { recursive: true });
await mkdir("dist/licenses", { recursive: true });
for (const file of ["LICENSE", "THIRD_PARTY_NOTICES.md", "README.md"])
  await cp(file, `dist/${file}`);
for (const name of [
  "react",
  "react-dom",
  "scheduler",
  "lucide-react",
  "page-flip",
  "pdfjs-dist",
  "@fontsource/dm-sans",
  "@fontsource/libre-caslon-display",
]) {
  const dest = `dist/licenses/${name.replaceAll("/", "-")}`;
  await mkdir(dest, { recursive: true });
  for (const f of await readdir(`node_modules/${name}`))
    if (/^(license|copying|ofl|notice)/i.test(f))
      await cp(`node_modules/${name}/${f}`, `${dest}/${f}`, {
        recursive: true,
      });
}
const archive = `flipbook-v${pkg.version}-web.zip`;
// -FS synchronizes the archive when rebuilding the same version.
execFileSync("zip", ["-q", "-r", "-FS", `../release/${archive}`, "."], {
  cwd: "dist",
});
const bytes = await readFile(`release/${archive}`);
await writeFile(
  "release/SHA256SUMS.txt",
  `${createHash("sha256").update(bytes).digest("hex")}  ${archive}\n`,
);
console.log(
  `Packaged release/${archive} (${bytes.length} bytes) with licenses and SHA-256 checksum.`,
);
