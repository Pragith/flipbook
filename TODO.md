# TODO

The GitHub release is published. The main gaps before a broad launch are data durability, broader testing and public hosting. The hosted 0.2.0 deployment is now available at https://flipbook.vriksh.ca.

## Launch priorities

Complete these in order:

1. [ ] **Complete browser persistence testing.** Save notes and bookmarks, close and reopen the app, switch PDFs, rename and re-upload the same PDF, and verify that progress restores. The current 12 automated tests do not cover this entire browser flow.
2. [ ] **Fix simultaneous-tab overwrites.** Prevent two tabs editing the same document from replacing each other's saved changes.
3. [ ] **Add backup import.** Allow users to restore the reading-data JSON backups that the app already exports.
4. [ ] **Test browsers and devices.** Cover Safari, Firefox, Chrome, iPhone/iPad and Android, especially touch page turns, text selection, themes and the landing page without vertical scrolling.
5. [ ] **Check accessibility.** Verify keyboard focus, menus, screen readers, contrast, zoom and reduced motion.
6. [ ] **Test difficult PDFs and loading conditions.** Cover large or image-heavy documents, malformed files, slow URLs and interrupted loads. Measure memory usage in particular.
7. [x] **Deploy a public HTTPS app.** Verify local PDF opening, URL loading, sharing, downloads and PDF support assets on the actual deployment.

## Additional features

- [ ] Support password-protected PDFs.
- [ ] Support internal PDF links.
- [ ] Support mixed page sizes.
- [ ] Allow editing existing notes.

## Current storage behavior

Uploaded PDFs are not retained after refresh. Users must reopen the file; its saved notes, bookmarks and reading position should then return. Clearing browser site data removes that saved reading data.

## 2026-10-20 deployment

- [x] Configure a dedicated Cloudflare Tunnel and proxied DNS; retain shared domain/API credentials and app connector credentials separately in OpenBao.
- [x] Deploy production Compose stack, visible version metadata and the requested Google Analytics property.
- [x] Add Flipbook as the fourth homepage showcase app on vriksh.ca, with real reader media.
- [x] Record final public validation and source/image evidence in docs/releases/v0.2.0.md.
