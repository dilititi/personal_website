# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Before changing code, also read `ENGINEERING.md`** (the binding engineering contract — invariants, change recipes, Definition of Done) and `PLAN.md` (phased roadmap). This file describes _what the architecture is_; `ENGINEERING.md` describes _what every change must satisfy_.

## Commands

```bash
npm install         # Node ^20.19.0 || >=22.12.0 (per package.json#engines)
npm run dev         # vite dev server
npm run build       # production build → dist/
npm run preview     # serve the built dist/ locally
npm test            # Vitest pure-function suite
npm run test:watch  # Vitest watch mode
npm run test:ui     # headless Chrome/Edge CDP smoke test
npm run test:ui:preview # same smoke against built/prerendered dist/
npm run lint        # ESLint
npm run check:dist  # reject React server renderer references in dist/
npm run format:check # Prettier verification
```

CI runs install → lint → Vitest → production build → `check:dist` → Prettier verification. The browser smoke test remains a local regression command because it requires Chrome or Edge.

## Architecture

React 19 + Vite 8 statically prerendered, client-hydrated single-page site whose copy lives in one bilingual data file. In-browser edits persist as browser drafts and can optionally be promoted to GitHub commits. The build emits `/`, `/en/`, and `/zh/` HTML; there is no router package and no backend in production (the only request-time server code is the dev-only upload middleware in `vite.config.js`).

### Provider chain

`src/prerender.jsx` renders the stable first frame (Landing + the first enabled section) during build. `src/main.jsx` hydrates that markup in production, or creates a fresh root in dev, then `<App>` wraps everything in four nested context providers (`src/App.jsx`):

```
LangProvider → DataProvider → StyleProvider → NowPlayingProvider → AppInner
```

`AppInner` renders `NavShell`, `Landing`, then iterates `sections` (About, Journey, Works, Library, Photography, Travel, Contact, Colophon, NowPlaying) — filtered by `isModuleEnabled` and sorted by `MODULES[id].order`. Each section receives a `layout` prop from `MODULES[id].layout`.

`ContentEditor` and `StyleEditor` are loaded through `React.lazy` only after their toolbar action is opened, keeping editor code out of the visitor-facing initial JavaScript chunk.

### Data layer (`src/data.js` + `src/data-context.jsx`)

- `src/data.js` exports `SITE`, `NAV`, `ABOUT`, `JOURNEY`, `WORKS`, `BOOKS`, `FILMS`, `MUSIC`, `PHOTOS`, `PHOTO_SERIES`, `TRAVEL`, `NOW_PLAYING`, `MODULES`, `TEXTS`, `READING_LOG`, `USER_READING_LOG`, plus helpers `L(en, zh)` and `pick(value, lang)`. **All site copy lives here** — components read from `useData()`, not by importing from `data.js` directly.
- `DataProvider` reads `localStorage["chen.content.overrides"]`; during hydration it starts from defaults, then restores storage after mount so server and client first frames match. `createSectionRegistry` derives the runtime data registry from **uppercase, non-function** `data.js` exports, then `deepMerge` resolves overrides. This naming rule is a contract: auxiliary exports such as version metadata must remain lowercase. It exposes mutation methods (`setSection`, `resetSection`, `resetAll`, `exportOverrides`).
- `useLocalStorageState` compares serialized persistence snapshots, so initial mount and React StrictMode effect replay do not rewrite data or advance `lastSaved`. Only successful writes update the timestamp; full reset atomically clears both the value and timestamp keys.
- `MODULES` is special: each value is `{ enabled, nav, order, label, layout }`. Legacy boolean overrides get normalized into this shape by `normalizeModuleConfig`. Use the helpers `getModuleConfig(id)`, `isModuleEnabled(id)`, `isModuleInNav(id)` — don't read `MODULES[id]` directly when you need the resolved value.
- The ContentEditor's export buttons (per-section "Copy", "📋 All", and the `data.js` download) serialize sections to pasteable `export const X = ...` JS via `exportLine` / `jsLiteral` in `src/components/editor/export.js`, which emits idiomatic `L(en, zh)` calls. The GitHub publisher reuses this same serializer; there is intentionally no second serialization path.

### GitHub publishing (`src/lib/github.js` + `src/lib/publish.js`)

- Both editors expose a shared `PublishPanel`. It accepts a fine-grained PAT limited to the target repository and Contents read/write, verifies the repository and branch, then commits directly through the GitHub Contents REST API. There is no production backend.
- `src/data.js` and `src/style.js` contain `EDITOR:*` sentinel pairs. Publishing replaces only selected export declarations inside those bounds, preserving every unselected declaration and all text outside the region. A 409 conflict refetches the current SHA and retries once.
- `chen.github.config` stores owner/repository/branch in localStorage. `chen.github.token` uses sessionStorage by default and localStorage only when the user explicitly selects “remember”; storage failure falls back to the token held in the open panel.
- Publication validates the resolved content/style, rejects large embedded data URLs and token-looking source, and confirms referenced public assets either exist on the current site or in the target GitHub branch.

### SEO / document head (`src/lib/seo.js` + `vite.config.js`)

- `SITE.url` is the canonical production origin. Template instances must replace the demo URL at deployment time.
- `SITE.ogImage` is the dedicated 1200x630 social image; `SITE.portrait` is page content and only remains a backward-compatible SEO fallback. `SITE.googleSiteVerification` optionally emits the Search Console verification meta.
- `buildSeo(SITE, lang)` is the single source for title, description, canonical URL, social image, and locale metadata.
- `seoHtmlPlugin()` injects static head tags in dev and writes `dist/robots.txt` plus `dist/sitemap.xml`; `src/prerender.jsx` supplies route-localized build head data. An empty `SITE.url` emits a build warning and omits fake absolute URLs.
- `vite-prerender-plugin` emits `/`, `/en/`, and `/zh/`. Language routes use route-specific canonical URLs and `en` / `zh` / `x-default` alternates when `SITE.url` is configured.
- `prerenderArtifactCleanupPlugin()` removes the build-only prerender entry and React server renderer after HTML generation; neither is part of the browser-reachable bundle.
- `useDocumentHead()` updates the existing title/meta/link nodes when language or resolved SITE data changes. It does not append duplicate tags.
- `index.html` intentionally contains only generic fallback metadata. Do not copy SITE wording into it.

### Style layer (`src/style.js` + `src/style-context.jsx` + `src/style-engine.js`)

- `style.js` defines `DEFAULT_STYLE` (a structured config: `design`, `color`, `typography`, `space`, `motion`, `texture`, `light`, `depth`, `culture`, `mood`, `anchors`) and named `STYLE_PRESETS` (`editorial`, `ink`, `coldModern`, `darkAcademic`, `journal`, `film`, `y2k`, `organic`).
- `StyleProvider` loads `localStorage["chen.style.overrides"]` (deferred until after hydration for prerendered pages), merges onto defaults, then calls `applyStyleToDocument` — which runs `deriveStyleVars(style)` from `style-engine.js` and writes CSS custom properties (`--ink-void`, `--style-shadow-card`, `--style-image-filter`, etc.) onto `document.documentElement`. It also sets `body.dataset.motion` and `body.dataset.styleAlignment`.
- `deriveStyleVars` consumes the design / color / typography / space / motion / texture / light / depth knobs, plus `color.temperature` (warm/cool palette tint) and `typography.personality` (default display/body font pairing — explicit `display`/`body` still override). `culture`, `mood`, and `anchors` are descriptive "mood board" metadata: saved with the style and exported, but not applied to rendering.
- `src/styles.css` is the only CSS file imported (from `main.jsx`); the entire visual system reads from the CSS vars emitted by `deriveStyleVars`. Renaming a variable in `style-engine.js` will silently break the stylesheet.
- The `StyleEditor` opens a live preview by loading the same site inside an iframe with `?stylePreview=1`; `NavShell` hides the editor buttons when that flag is present.

### Bilingual conventions

- Bilingual values are `{ en, zh }` objects produced by `L(en, zh)`. Use `pick(value, lang)` or `useLang().t(value)` to resolve them — `pick` falls back zh → en → '' and refuses to return raw objects (React can't render them).
- Strings in `title` / `intro` / `text` / `value` fields may contain `*asterisks*` for italic accent rendering — use `emph(str)` from `src/hooks.jsx`, which splits on `/(\*[^*]+\*)/g` and wraps matches in `<em>`.

### In-site editors and media upload

- `ContentEditor.jsx` (opened from the "Content editor" / "内容编辑器" button in `NavShell`) is driven by `src/components/editor/schema.js`, which declares per-section field schemas (`bi`, `bi-text`, `obj-arr`, `file-image`, `file-audio`, etc.) and item title formatters. To add an editable field, update this schema **and** the matching default in `data.js` — they can drift silently.
- In dev, `file-image` / `file-audio` / `file-pdf` fields POST to `/api/upload` (defined in `vite.config.js` via `uploadPlugin`) and write into whitelisted `public/{subfolder}/` directories.
- In production, the same fields use the verified GitHub configuration and token to commit files to `public/{subfolder}/`. Without a token they safely fall back to manual public-path entry. Images are resized client-side and may generate `480/960/1440/1800` responsive variants before either upload path.

### Section conventions

- Each section component applies its `layout` prop as a `data-layout` attribute; `default`, `compact`, and `feature` are all implemented via `section[data-layout=…]` rules in `src/styles/sections.css`. Each section is responsible for its own grid/spacing.
- The `NowPlaying` widget (`src/np-context.jsx`) supports three sources (`spotify`, `netease`, `html5`) — the chosen source persists to `localStorage["chen.np.source"]`. User-uploaded audio files appear in the `html5` queue alongside the bundled `NOW_PLAYING.html5` tracks.
- `useReveal()` in `hooks.jsx` adds `.is-revealed` to any element with `data-reveal` when it intersects the viewport (scroll-in reveal).

### Things to be aware of

- Browser storage remains the draft layer and there is no backend in production. Owners can either use the existing copy/download flow or publish the selected overrides directly to GitHub; source files in git remain authoritative.
- Browser storage keys: `chen.content.overrides`, `chen.content.lastSaved`, `chen.style.overrides`, `chen.style.lastSaved`, `chen.lang`, `chen.np.source`, `chen.ce.{mode,sideWidth,autosave}`, `chen.se.{mode,sideWidth}`, `chen.content.preImport`, `chen.github.config`, and `chen.github.token` (session by default, local only when remembered).
- Legacy readers for `chen.readingLog.userEntries` and `chen.photos.userEntries` migrate old per-feature data into `chen.content.overrides`; both shims are scheduled for removal after 2026-12-31 and must never receive new writes.
