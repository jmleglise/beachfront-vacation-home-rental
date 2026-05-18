# This file provides guidance to Code when working with this repository.

## Commands

| Command | Purpose | Notes |
|---|---|---|
| `yarn install` | Install dependencies | Use Yarn 1 (`packageManager: yarn@1.22.19`). |
| `yarn dev` | Run local dev server | Executes `generate-json` then `astro dev`. |
| `yarn build` | Produce static build | Executes `generate-json` then `astro build`. |
| `yarn preview` | Preview generated site | Validate static output before deploy. |
| `yarn check` | Type/content checks | Runs `astro check`. |
| `yarn format` | Format `src/` files | Uses Prettier + Astro/Tailwind plugins. |
| `yarn generate-json` | Regenerate generated JSON content | Calls `scripts/jsonGenerator.js`; run before build if content changed. |

### Deployment workflow (Cloudflare Pages)
- Hosting target: **Cloudflare Pages**.
- Output mode is **fully static** (`output: "static"`), therefore no server runtime is expected in production.
- Ensure the Pages build command runs `yarn build` and publish directory is `dist/`.
- Keep absolute URLs consistent with `config.site.base_url` to avoid sitemap/canonical issues.

## Tech Stack

- **Framework:** Astro 4 + React integration (`@astrojs/react`).
- **Styling:** TailwindCSS + SCSS layers in `src/styles`.
- **Content:** Astro Content Collections (`src/content/config.ts`) + JSON-driven configuration.
- **Markdown/MDX:** `@astrojs/mdx`, `remark-toc`, `remark-collapse`.
- **Media:** `sharp` image service configured in `astro.config.mjs`.
- **Slider/Gallery:** Swiper + PhotoSwipe + React lightbox initializer.
- **SEO/Indexing:** Custom sitemap integration via `scripts/custom-sitemap.js`.
- **Infrastructure:** Static hosting on Cloudflare Pages.

## Architecture & File Structure

## 1) Configuration-first architecture
The project behavior is heavily controlled by configuration files and Astro config:

- `astro.config.mjs`
  - Core behavior for routing, i18n, markdown, integrations, and static output.
  - **Important constraints:**
    - `trailingSlash: 'always'` means every generated URL must end with `/`. Avoid hardcoded links without final slash.
    - `output: "static"` means no server-only logic; all pages must be pre-renderable at build time.
  - i18n locale list is computed dynamically from `src/config/language.json`, then filtered by disabled languages in `src/config/config.json`.

- `src/config/config.json`
  - Main source of truth for site identity, base URL/path, and settings (default language, disabled languages, etc.).

- `src/config/language.json`
  - Locale registry consumed by Astro i18n setup.

## 2) Directory map and responsibilities

| Directory | Role | Implementation guidance |
|---|---|---|
| `src/pages/` | Route definitions | Prefer file-based routing; multilingual pages live under `src/pages/[...lang]/`. |
| `src/layouts/` | Shared page shells | Keep structural HTML and SEO defaults here. |
| `src/components/` | Reusable UI components | Keep behavior isolated; avoid page-specific business logic. |
| `src/lib/` | Parsing/transformation utilities | Centralize content parsing (taxonomy, content transforms). |
| `src/content/` | Content collection schema | Update `config.ts` when adding new content model fields. |
| `src/config/` | JSON configuration | Treat as source of truth for menu, site settings, language behavior. |
| `src/i18n/` | UI translation dictionaries | Keep translation keys stable across locales. |
| `src/styles/` | Global style layers | Preserve existing layer order and naming conventions. |
| `scripts/` | Build-time tooling | Contains sitemap customization, JSON generation, and maintenance scripts. |
| `public/` | Static assets served as-is | Place images/files not processed by Astro pipeline. |
| `config/nginx/` | Legacy/server config docs | Non-runtime for Cloudflare Pages; keep only if still needed for reference. |

## 3) High-impact files (read before major edits)

| File | Why it matters |
|---|---|
| `astro.config.mjs` | Governs static output, trailing slash behavior, i18n routing, markdown plugins, integrations, and image service. |
| `src/config/config.json` | Canonical site-level settings used across templates and config logic. |
| `src/config/language.json` | Declares available locales used to build Astro i18n locale list. |
| `src/content/config.ts` | Content schema contract for blog/content collections. |
| `src/lib/contentParser.astro` | Core content ingestion/parser helpers used by pages. |
| `src/lib/taxonomyParser.astro` | Category/tag taxonomy shaping for listing pages. |
| `scripts/custom-sitemap.js` | Sitemap customization; must stay coherent with i18n and trailing slash rules. |
| `scripts/jsonGenerator.js` | Build-time JSON generation required by `dev`/`build` scripts. |
| `src/components/GalleryLightboxInit.tsx` | Client-side initializer for gallery/lightbox behavior. |

## Content Conventions

- **Multilingual routing**
  - Routes are locale-prefixed via Astro i18n (`prefixDefaultLocale: true` currently active).
  - Keep every new content page available per active locale or provide explicit fallback behavior.
  - When adding/removing languages, update `src/config/language.json` and `config.settings.disable_languages` accordingly.

- **URL policy and SEO**
  - Respect trailing slash policy in all internal links/canonical URLs.
  - Ensure sitemap entries match final URLs exactly (including locale prefixes and trailing `/`).
  - Prefer deterministic slug generation for blog/category/tag pages.

- **Content injection mechanics**
  - Data is injected into pages through JSON config (`src/config/*.json`), content collections, and parser helpers in `src/lib/`.
  - Reuse parser utilities instead of duplicating filtering/sorting logic in page files.
  - Run `yarn generate-json` whenever source content structure changes.

- **Swiper / gallery usage**
  - Keep slider state and DOM initialization encapsulated in components.
  - Ensure hydration strategy is minimal (client directives only where necessary) to preserve static-page performance.
  - Validate accessibility: keyboard navigation, focus handling, and meaningful alt text for images.

## Code Style

- Use clear, explicit TypeScript types where possible (especially in parser/helpers).
- Keep page files thin: fetch/prepare data in `src/lib`, render in `src/pages`/`src/layouts`.
- Prefer configuration-driven behavior over hardcoded constants.
- Do not break existing locale key names without synchronized updates in all translation files.
- Preserve URL and routing invariants:
  - trailing slash always,
  - locale-prefixed routes,
  - static-compatible logic only.
- Before finalizing changes touching routing/content:
  - run `yarn check`,
  - run `yarn build`,
  - manually verify a sample of localized pages and gallery pages.

## UX/UI & Responsive Design

- **Mobile-first priority**
  - Always design and validate pages from small viewport to large viewport.
  - Start with baseline mobile layout, then progressively enhance for tablet/desktop.
  - Keep critical actions visible above the fold on mobile (booking CTA, contact, navigation).

- **Multi-resolution support**
  - Target at least these breakpoints during development and QA:
    - Mobile: `320px` → `767px`
    - Tablet: `768px` → `1023px`
    - Desktop: `1024px`+
    - Wide desktop: `1440px`+
  - Validate hero, gallery, and booking blocks across these ranges to prevent overflow/cropping regressions.
  - For images, prioritize responsive dimensions and compressed assets; avoid shipping oversized originals in page markup.

- **How styles are defined in this project**
  - Styling combines **Tailwind utilities** and **global SCSS partials** in `src/styles/`.
  - Main style entrypoint is `src/styles/main.scss`, with logical split across:
    - `base.scss` (resets/foundation)
    - `components.scss` (shared component-level rules)
    - `navigation.scss` (menus/header/nav behavior)
    - `buttons.scss` (button variants and states)
    - `utilities.scss` (helpers/utility classes)
  - Keep style responsibilities separated: global tokens/layout rules in SCSS, local one-off layout adjustments via Tailwind utilities close to markup.

- **Component UX rules (Swiper / gallery / media)**
  - Swiper-based sections must keep touch interactions smooth on low-end mobile devices (avoid expensive effects by default).
  - Ensure swipe targets are large enough and controls are keyboard accessible on desktop.
  - Maintain consistent spacing rhythm between slides/cards across breakpoints.
  - Gallery/lightbox should preserve aspect ratio, provide meaningful `alt` text, and avoid layout shift during image load.

- **Accessibility and readability baseline**
  - Ensure contrast is sufficient for text and interactive elements.
  - Keep minimum touch target size comfortable on mobile.
  - Validate focus visibility for keyboard users, especially in nav, forms, and gallery controls.
  - Avoid dense paragraphs on small screens; preserve readable line-length and vertical spacing.
