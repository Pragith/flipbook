# Security policy

## Supported version

Security fixes target the latest 0.x release and `main`. Older releases are not maintained independently.

## Report a vulnerability

Use the repository's **Security → Advisories → Report a vulnerability** flow when available: https://github.com/Pragith/flipbook/security/advisories/new . If it is unavailable, open a minimal issue asking the maintainer for a private reporting channel; do not disclose exploit details publicly.

Include the affected release, browser, reproduction steps and impact. Do not send private documents without arranging an appropriate channel.

## Design boundaries

PDFs are parsed and rendered by PDF.js in the browser. Keep dependencies current and treat unknown documents as untrusted. Local files are not uploaded by the application. URL loads contact the document host directly; flipbook includes no general-purpose proxy and never asks a server to fetch arbitrary internal URLs. Internet Archive download links use Archive.org's own CORS endpoint. Link inputs allow only explicit HTTP(S) URLs without embedded credentials. Ordinary browser-origin and mixed-content policies remain in force.

PDF passwords, cloud access control, authenticated URL workflows and multi-user sharing are not implemented. Hosts should use HTTPS, apply appropriate HTTP security headers and restrict deployment permissions. Do not put private tokens in publicly shared URLs.
