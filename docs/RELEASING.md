# Releasing

Releases use Semantic Versioning. The first release is `0.1.0`; all 0.x builds are marked prerelease while the interface and behavior evolve.

1. Update `package.json` and `package-lock.json` to the intended version.
2. Add a dated changelog entry and `docs/releases/vX.Y.Z.md` with behavior, compatibility and verification notes.
3. Update the release workflow's notes path for that release.
4. Run `npm ci`, `npm test`, `npm run build`, `npm audit --omit=dev` and `node scripts/package-release.mjs`.
5. Inspect the app, logo, favicon, welcome screen, file/URL opening and core reader interactions. Do not claim unrun browser or device checks.
6. Confirm that private test PDFs are absent from Git and the release ZIP.
7. Commit and push `main`; wait for CI. Tag that verified commit (`git tag -a vX.Y.Z -m 'flipbook vX.Y.Z'`) and push the tag.
8. The tag-triggered Release workflow checks the version, tests/builds, creates `flipbook-vX.Y.Z-web.zip` and `SHA256SUMS.txt`, then publishes the GitHub prerelease. GitHub supplies source archives.
9. Read the published release and download its assets. Verify the checksum and confirm that the tag, commit and package version agree.

The ZIP includes the compiled app, original sample PDF, MIT license, README, third-party notices and dependency license texts. It must be served over HTTP(S). `scripts/package-release.mjs` refuses to package a build whose PDF differs from the original `assets/sample.pdf`.

Logo sources are in `public/brand/logo.svg`; keep `public/favicon.svg` aligned. Optional raster regeneration uses `rsvg-convert` and ImageMagick. Optional sample regeneration: `uv run --with reportlab python scripts/create-demo.py`. Neither tool is required for normal installation or builds because those artifacts are committed.
