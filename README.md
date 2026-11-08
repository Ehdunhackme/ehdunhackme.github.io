# Dun Li Chan's portfolio

Next.js App Router + React + TypeScript. The existing content, card design, colours, typography, search, galleries, name glitch, and entrance animations are retained.

## Run locally

Requires Node.js 24 and npm, matching the [Vercel Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Next.js runs through its local server; opening an `index.html` file is no longer the preview workflow.

To test a production build:

```sh
npm run build
npm run start
```

## Edit the site

- `src/content/home.tsx`: intro, journey timeline, motivations, honours.
- `src/content/projects.tsx`: project and publication cards, links, search text, and explanations.
- `src/content/writings.tsx`: writing directory.
- `src/content/research-guide.tsx`: the full article.
- `src/content/midterms-2026.json`: the generated midterm modeling article and tables; `midterms-2026.tsx` renders it as a server component.
- `research/midterms-2026/`: the complete election project: Python models, frozen inputs, benchmark results, tests, article generator and live comparison. It is part of this repository, with no separate repository or submodule to fetch.
- `research/midterms-2026/website/live/`: shared live-result code, imported directly by the article. Results refresh from civicAPI every minute while visible; failed requests retain saved results. See the [comparison notes](research/midterms-2026/docs/live-results.md).
- `public/assets/writings/midterms-2026/`: responsive figures and downloadable data. After rebuilding the model, `npm run sync:midterms` updates the article and assets from the local research folder.
- `src/components/`: reusable navigation, search, card transitions, gallery, theme, and explanation interactions.
- `src/styles/`: the existing styles, scoped to their original page families to avoid changes during navigation.
- `public/assets/`: images and other public media, still available at `/assets/...`.
- `src/fonts/`: locally hosted fonts and their licences.

Keep each project's `searchText` in sync when changing its visible text. Stable entry IDs preserve links to individual papers.

Pages and paper explanations render at build time. Navigation uses Next.js links and prefetching, keeping the header mounted. Photos and paper thumbnails use responsive Next.js image optimisation; small logos have WebP versions. Below-the-fold photos load lazily. Fonts are bundled locally, so rendering no longer depends on Google Fonts requests. Motion respects reduced-motion preferences, and event handlers/timers are cleaned up when leaving a page.

## Verify

The normal website build uses the committed article and assets. Python is only
needed to reproduce the analysis. Follow the [model README](research/midterms-2026/README.md)
to rebuild it, then run `npm run sync:midterms` from this directory.

```sh
npm run build
npm run typecheck
npx playwright install chromium webkit
npm test
```

Tests run against the production server and cover desktop/mobile navigation, document preservation, search, explanations, cards and browser history, galleries, theme persistence, legacy URLs, and reduced motion. On a Windows machine with Edge installed, set `PLAYWRIGHT_CHANNEL=msedge` to use it instead of downloaded Chromium.

Migration checks compared the previous HTML site's desktop and mobile layouts. On the development machine, streamed localhost responses also stalled with a plain file server; the review preview used a temporary local response-buffering adapter in the ignored `.migration/` directory. That adapter is not part of the app, CI, or Vercel configuration. Production builds retain Next.js's normal streaming and compression.

## Vercel

1. Import this Git repository into Vercel and select the migration branch for an initial preview deployment.
2. Use the **Next.js** framework preset, repository root as the root directory, `npm ci` to install, and `npm run build` to build. Leave the output directory at the framework default. `vercel.json` already declares these settings.
3. Review the generated preview URL, including direct paper links and mobile navigation.
4. Once approved, merge the migration into `main`, use `main` as the production branch, and add `dunlichan.com` in Vercel's domain settings. Apply the DNS records Vercel provides for that project.

No secrets or environment variables are required. The Chert iframe remains hosted at `chert.dunlichan.com`; this migration does not deploy or change that service.

The Next.js site is deployed by Vercel. GitHub Actions runs build/browser checks.

## Legacy GitHub Pages address

GitHub Pages publishes only `main` → `/docs` (Settings → Pages → Deploy from a branch). The small redirect in `docs/index.html` sends `ehdunhackme.github.io` visitors to `https://dunlichan.com/`. `docs/404.html` handles old deep links, preserving the path, query string, and section hash; trailing `index.html` is converted to the clean route. Browsers without JavaScript fall back to the new homepage.

Keep the two redirect documents identical. Do not add a GitHub Pages custom domain or publish the repository root: `dunlichan.com` belongs to the Vercel deployment, and the Next.js source tree is not a static website.

Existing `.html` URLs redirect to the corresponding clean route, including anchors. `/about/` forwards its card hash to the homepage, `/papers/` forwards to the publications section, and `/work/` forwards to projects. Original static sources are preserved in Git at `f4c1f04` and in the local ignored `.migration/legacy/` backup.
