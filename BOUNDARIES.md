# Ownership Boundaries (v1.x)

`al-folio` is a starter kit. Runtime/component ownership lives in gems.

## Runtime ownership

- `al-folio` (starter): example content, wiring, docs, integration harness.
- `al_folio_core`: shared layouts/includes/runtime primitives and upgrade contracts.
- `al_folio_distill`: Distill templates/runtime assets.
- `al_cookie`: cookie consent runtime assets and consent logic.
- `al_icons`: icon runtime loading (Font Awesome, Academicons, Scholar Icons).
- `al_search`: search runtime payload (`ninja-keys`, search setup/hotkey assets).
- Other `al-*` gems: feature-specific assets, tags, filters, and runtime behavior.

## Plugin naming convention

- Theme-coupled plugins:
  - GitHub repo: `al-folio-<feature>`
  - gem/plugin id: `al_folio_<feature>`
- Reusable plugins:
  - GitHub repo: `al-<feature>` or neutral name
  - gem/plugin id aligned with plugin namespace
- Third-party non-`al-*` plugins are valid ecosystem plugins and may be featured.

## Featured vs bundled plugins

- `featured`: listed in docs/catalog with metadata and compatibility, but not required in starter dependencies.
- `bundled`: included in starter wiring (`Gemfile` + `_config.yml` plugin list) and shipped by default.

Use [`_data/featured_plugins.yml`](_data/featured_plugins.yml) as the catalog source of truth.

## Minified asset policy

- Use pinned CDN assets (with SRI) for stable standalone third-party libraries.
- Keep vendored release-time artifacts (with provenance) only where ownership needs complex runtime/module graphs (for example: `al_search`, `al_folio_distill`).
- Do not add install-time network fetches in `gem install` / `bundle install` paths.

## Test ownership

- `al-folio` tests:
  - Visual regression/parity (`test/visual/**`)
  - Cross-gem integration checks (plugin toggles, compat wiring, upgrade smoke tests)
  - Starter wiring contracts only
- Gem-local tests (`al-folio-core`, `al-folio-distill`, `al-*`):
  - Component correctness (tags, filters, generators)
  - Runtime asset packaging contracts
  - Feature edge cases
  - Migration/upgrade contract logic in the owning gem

## Prohibited pattern

- Do not duplicate gem-owned component correctness tests in `al-folio`.
- Do not add local starter copies of gem-owned runtime files unless intentionally overriding behavior.

## PR triage playbook

- If a PR changes starter wiring/docs/content/tests only: keep it in `al-folio`.
- If a PR changes gem-owned runtime/component behavior: redirect/port to the owning gem repo.
- If a PR introduces a feature without an owner:
  - create a plugin proposal issue
  - recommend a standalone plugin repo
  - close/redirect the starter PR with references.
