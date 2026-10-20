# Changelog

All notable changes are recorded here. Versions follow [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-10-20

### Added

- Public HTTPS hosting at https://flipbook.vriksh.ca with an unprivileged Nginx container, health checks, restart policies and a dedicated Cloudflare Tunnel in Docker Compose.
- Google Analytics property `G-5G040P491R`; initial pageview metadata excludes PDF URL query parameters. Add a regression test for that boundary.
- Manifest-derived visible version and generated `/version.json` for deployment verification.
- OpenBao connector-token loading, operational instructions and repeatable public browser checks.

### Fixed

- Serve PDF.js module workers with the correct JavaScript MIME type and retain real 404s for missing assets.
- Start backward page turns inside the actual page bounds, including centred portrait pages on phones.
- Use square corners for controls and panels while preserving logo and document artwork.
- Split PDF.js into its own application chunk to keep production builds free of chunk-size warnings.

## [0.1.0] - 2026-10-20

### Added

- Single-viewport upload/URL landing page and a UTM-linked Vriksh Apps credit.
- Sage, White and true-black Dark appearance themes with a persistent choice.
- Public PDF URL loading with first-party Internet Archive CORS support.
- Local-first PDF rendering, interactive page folds and synthesized page-turn audio.
- Progress-dependent paper stacks with hover targets and direct navigation.
- Selectable text in normal and zoomed views.
- Paired spread thumbnails, numeric labels and an active-only outline.
- Text search, per-document notes, bookmarks and saved position.
- Validated saved data, storage-failure warnings and JSON reading-data export.
- Keyboard controls, local opening, drag-and-drop, sharing, download and fullscreen.
- Zoomed PDF links and a browser PDF printing handoff.
- Original logo, favicons, self-hosted fonts and a 24-page original sample.
- MIT licensing, third-party notices, contribution and security policies.
- Automated tests, CI and release archives with SHA-256 checksums.

[0.1.0]: https://github.com/Pragith/flipbook/releases/tag/v0.1.0
