# Deployment

flipbook builds to a static `dist/` directory. No backend or application runtime is required after building.

```sh
npm ci
npm test
npm run build
npm run preview
```

Publish the full `dist/` directory, not the repository or development server. Include `cmaps/`, `standard_fonts/`, `wasm/`, `book.pdf`, the worker chunk and brand assets. Serve HTML, JavaScript (`.js`/`.mjs`), WASM and PDFs with their correct content types. Disable directory listing and use HTTPS. Browser clipboard behavior depends on a secure context.

For a path such as `https://example.com/flipbook/`:

```sh
VITE_BASE_PATH=/flipbook/ npm run build
```

Serve that build at the same path. A root build is not interchangeable with a subpath build. The application uses query parameters, not path routing, so no SPA catch-all is required for its reader links. Avoid rewriting missing PDF/WASM/worker assets to `index.html`.

## Documents and URLs

The welcome page asks users to open a file or enter a URL. Local files are processed in the browser. URL loading requires CORS permission from the host. Internet Archive `/download/` links are internally requested through its `/cors/` endpoint. There is no generic third-party proxy or server-side fetch service.

The included original sample is copied to `dist/book.pdf`. To expose other hosted documents, publish files you have permission to distribute and enter their URLs in the viewer.

For shared reader links, preserve `?pdf=<encoded-url>&page=<number>`. Anyone following the link must be able to access that document URL. Temporary local blob URLs are not shareable.

## Caching and security

Long-cache hashed assets under `assets/`, but let browsers revalidate `index.html` and `book.pdf` on releases. Use HTTPS and consider `X-Content-Type-Options: nosniff`, an appropriate referrer policy and framing policy. A custom CSP must allow the local worker, Blob-backed local documents, needed remote PDF origins, Canvas/WASM rendering and PDF.js's style layers; validate it with real documents before enforcing it.

The manifest provides app metadata and icons. There is no service worker or guaranteed offline mode.

## Docker Compose

To build and run a local production server:

```sh
docker compose up -d --build
curl --fail http://localhost:8080/healthz
```

Open http://localhost:8080. Set `FLIPBOOK_PORT` to choose a different host port. The container runs Nginx without root privileges and serves the compiled app from a read-only filesystem. Use your own HTTPS reverse proxy to expose it publicly.

The build generates `/version.json` from `package.json` and displays the same version in the app credit. Nginx serves PDF.js `.mjs` workers as JavaScript; missing assets return 404.

For browser verification, install Playwright for Python and Chromium, then run `python3 scripts/verify-deployment.py --base-url YOUR_HTTPS_URL`. Evidence is written under ignored `output/deployment/`.
