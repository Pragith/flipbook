# Flipbook operations

- Product version comes from `package.json`; synchronize `package-lock.json` and the Compose image tag for releases. Vite embeds the manifest version in the shared credit, and the build generates `/version.json` from the same manifest.
- Production URL: https://flipbook.vriksh.ca. Run `docker compose up -d --build` from this directory. Nginx serves the static production build; localhost health endpoint: http://127.0.0.1:4781/healthz.
- Cloudflare remotely managed tunnel: `flipbook-vriksh-ca` (`23062168-3f3a-433a-9a17-273cb44b77d3`), ingress `flipbook.vriksh.ca` → `http://web:8080`, final rule `http_status:404`.
- OpenBao namespace `pragithai`, KV v2 mount `apps`, path `flipbook`: `CLOUDFLARE_TUNNEL_TOKEN`, `CLOUDFLARE_TUNNEL_ID`, `APP_URL`. Shared domain API credentials are at mount `fleet`, path `cloudflare/vriksh.ca`.
- Set `BAO_ADDR`, `BAO_NAMESPACE`, `BAO_TOKEN` in the environment and run `python3 scripts/load-tunnel-secret.py` before starting Compose on a fresh host. It loads the connector token into ignored `.secrets/cloudflare-tunnel-token` with a read ACL for cloudflared UID 65532. Never print or commit tokens or unseal keys.
- Network `10.169.0.0/28` is reserved for this app on the current fleet host because Docker's automatic address pools are exhausted. Verify overlap before relocating.
- Preserve original logo/artwork; panels and controls use square corners.
- Run `npm test`, `npm run build`, `npm audit --omit=dev`, `docker compose config --quiet`, and browser checks before publishing. Check actual PDF rendering: `.mjs` worker responses must use JavaScript MIME type; missing support assets must return 404.
- Update `CHANGELOG.md`, `TODO.md` and release evidence for meaningful changes. Commit and push only intended source changes. Do not rewrite published releases or use force pushes.
