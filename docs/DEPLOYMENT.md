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

## Production Docker Compose

The fleet hosts https://flipbook.vriksh.ca with the checked-in multi-stage Dockerfile and Compose stack. Nginx runs without root privileges and listens only on host loopback port 4781. A dedicated Cloudflare Tunnel connects the public hostname to `http://web:8080`; no public origin port is needed.

Before starting on a fresh host, authenticate to OpenBao with `BAO_ADDR`, `BAO_TOKEN` and `BAO_NAMESPACE=pragithai`, then run:

```sh
python3 scripts/load-tunnel-secret.py
docker compose config --quiet
docker compose up -d --build
curl --fail http://127.0.0.1:4781/healthz
curl --fail https://flipbook.vriksh.ca/version.json
```

The script reads KV v2 mount `apps`, path `flipbook`; it requires `setfacl` for the connector UID's read permission. The connector token is a Compose secret file excluded from Git and the Docker build context. The shared Cloudflare API token stays in OpenBao at `fleet/cloudflare/vriksh.ca` and is not passed to either container. See `AGENTS.md` for tunnel routing and host subnet details.

The build generates `/version.json` from `package.json` and displays the same version in the welcome/reader product credit. Nginx explicitly serves `.mjs` as JavaScript for PDF.js workers. Missing support assets return 404 rather than the landing page.

Browser release verification: install Playwright for Python and its Chromium browser, then run `python3 scripts/verify-deployment.py`. This checks the actual public build and writes screenshots/results under ignored `output/deployment/`.
