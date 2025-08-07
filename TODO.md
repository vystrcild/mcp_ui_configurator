## TODO – Apify MCP Dashboard improvements

### Priority 0: Critical fixes
- [x] Null dereference on load: either add missing `#serverConfig` and `#serverUrl` containers in `index.html` or guard their usage in `assets/js/app.js` and unify on the existing `#mcpServerUrl`.
  - Files: `index.html`, `assets/js/app.js`
- [x] Replace missing placeholder icons: stop referencing deleted `assets/images/placeholder.svg` and switch to an existing asset (e.g., `assets/images/placeholder-user.jpg`). Add robust `onerror` fallback for actor and company images.
  - Files: `assets/js/app.js`, `assets/css/styles.css` (optional styles for fallbacks)

### Security and robustness
- [x] Scope static file serving. Replace `express.static('.')` with a scoped path and safe options (e.g., `app.use('/assets', express.static(path.join(__dirname, 'assets'), { dotfiles: 'ignore' }))`).
  - Files: `server.js`
- [x] Avoid injecting untrusted content via `innerHTML`. Build DOM with `createElement` + `textContent` or sanitize strings from the Store API (titles, descriptions, usernames) before insertion.
  - Files: `assets/js/app.js` (added `escapeHTML`, sanitized dynamic fields in actor cards, error UI)
- [x] Add `helmet()` and `compression()` middleware for baseline security and performance.
  - Files: `server.js` (also update `package.json` dependencies)
- [x] Add simple rate limiting and in-memory caching for the Store API proxy endpoints to protect token and reduce API load. (rate limiting added; caching TBD)
  - Files: `server.js`
- [x] Add 404 handler and tighten route ordering (serve `index.html` explicitly, then static, then 404).
  - Files: `server.js`
- [x] Configure Helmet CSP to allow external images and required CDNs (img-src https:, script/style/font-src as needed).
  - Files: `server.js`
- [x] Use Subresource Integrity (SRI) + `crossorigin` + `defer` on CDN scripts/styles (Prism, etc.).
  - Files: `index.html` (SRI + crossorigin + defer added for Prism core, language components, and toolbar plugin)
- [x] Startup without `APIFY_TOKEN`: don’t exit; serve UI but disable `/api/*` routes with 503 + clear UI messaging.
  - Files: `server.js`, `assets/js/app.js` (UI notice)

### UX and accessibility (a11y)
- [x] Tabs: add `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and keyboard navigation (Left/Right/Home/End). Sync ARIA when switching.
  - Files: `index.html`, `assets/js/app.js`
- [x] Modals: add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap while open, and return focus to opener on close.
  - Files: `index.html`, `assets/js/app.js`
- [x] Ensure modal close works with CSP by wiring JS listeners (overlay/click and ESC), and allow `script-src-attr 'unsafe-inline'` for inline handlers when present.
  - Files: `server.js`, `assets/js/app.js`
- [x] Clickable cards should be accessible: convert clickable `div`s to `<button>` or add `tabindex="0"` with Enter/Space handlers.
  - Files: `index.html`, `assets/js/app.js`, `assets/css/styles.css` (focus styles)
- [x] Ensure all icon-only buttons have textual labels (`aria-label`), including copy buttons and modal close.
  - Files: `index.html`, `assets/js/app.js` (runtime guard)

### Performance
- [x] Lazy load Prism only when integration modal opens; load only required languages; add `defer` and SRI.
  - Files: `index.html`, `assets/js/app.js`
  - [x] Add `loading="lazy"` and explicit `width`/`height` to images to reduce CLS; prefer WebP/optimized assets when possible.
  - Files: `index.html`, `assets/js/app.js`
- [x] Improve search determinism and relevance: add `sortBy=relevance` for search and `sortBy=popularity` for popular list on Store calls.
  - Files: `server.js`
- [x] Consider infinite scroll for the actor selection modal to avoid rendering large lists at once.
  - Files: `assets/js/app.js`, `assets/css/styles.css`


### Code quality and DX
- [x] Reduce verbose `console.log` in production; gate behind `NODE_ENV !== 'production'` or a `DEBUG` flag.
  - Files: `assets/js/app.js`, `assets/js/search.js`
- [x] Dev scripts: add `nodemon` for `npm run dev`, `lint`, `format`, and `engines` in `package.json`.
  - Files: `package.json`
- [x] Expose a simple dark-mode toggle (CSS already provides `.dark`); persist preference in `localStorage`.
  - Files: `index.html`, `assets/js/app.js`, `assets/css/styles.css`
- [ ] Optionally split large `styles.css` into logical modules or add a minimal build step for autoprefixing if targeting broader browsers.
  - Files: `assets/css/styles.css`

### Small fixes and polish
- [x] Clipboard: provide a fallback if `navigator.clipboard` is unavailable (insecure context), with a graceful message.
  - Files: `assets/js/app.js`
- [x] Add a catch-all route that serves `index.html` for SPA navigation (if we add more routes later).
  - Files: `server.js`

### Suggested dependency changes
- [x] Add: `helmet`, `compression`, `express-rate-limit`, `nodemon` (dev), `eslint`, `prettier` (dev)

### Notes and references
- Current mismatches
  - `assets/js/app.js` expects `#serverUrl` and `#serverConfig` containers but `index.html` only has `#mcpServerUrl`.
  - `assets/js/app.js` references `assets/images/placeholder.svg` which is removed; use `assets/images/placeholder-user.jpg` or add a new placeholder.
- API endpoints
  - `/api/search/actors` and `/api/popular/actors` should include `sortBy` where applicable.
  - Add caching and rate limiting to protect `APIFY_TOKEN` usage.


