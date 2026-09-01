# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page static demo site for a fictional design/architecture/build company,
in Thai, English, and Chinese. No build step, no package.json, no test framework,
no dependencies to install. GitHub Pages serves the repository root of `main`, so
**a push to `main` is a deploy** (live about 40 seconds later).

Live: https://tonyponyrin.github.io/demo-company-page/

## Commands

There is nothing to build or compile. To preview locally:

```bash
python -m http.server 8000     # then open http://localhost:8000
```

Do not open `index.html` as a `file://` URL. `cms.js` fetches `content/*.json`,
which a `file://` origin blocks, so the page silently falls back to the built-in
English copy and looks like the CMS is broken.

`/admin/` cannot be used locally at all — see "CMS authentication" below.

To redeploy the auth worker (rarely needed), from `d:\Project\sveltia-cms-auth`
(a separate clone, deliberately outside this repository):

```bash
npx wrangler deploy
```

## Content architecture

Three layers that must stay in agreement:

1. **`index.html`** carries English copy inline as a fallback, plus hooks:
   - `data-cms="hero.headline"` — replace the element's text
   - `data-cms-src` / `data-cms-alt` — replace an image's `src` / `alt`
   - `data-project-grid` — container the project cards are rebuilt into
2. **`content/site.json`** and **`content/projects.json`** hold every string in
   all three languages.
3. **`cms.js`** fetches both files and applies them over the DOM. If either fetch
   fails, the inline English copy stays and nothing breaks.

`admin/config.yml` declares the editor fields for the same data.

### The invariant that will bite you

A `data-cms` path, the nesting in `site.json`, and the field names in
`admin/config.yml` must match **exactly**, in all three places. A mismatch fails
**silently** — the value just falls back to the hardcoded English. Adding an
editable field therefore means editing three files, not one.

After touching any of them, verify with the checks under "Verifying changes".

### Language model

`site.json` uses Decap's `single_file` i18n structure, so each locale is a
top-level key and a lookup is `site[language].<dotted.path>`:

```json
{ "th": { "hero": { "headline": "..." } }, "en": { ... }, "zh": { ... } }
```

Image path fields use `i18n: duplicate`, so the same value is written into every
locale and can be read from whichever one is active.

`projects.json` deliberately does **not** use Decap i18n. Decap ties list length
to the default locale, which makes adding and reordering list items fragile, so
each project carries explicit `title_th` / `title_en` / `title_zh` fields
instead. Do not "unify" these two approaches; they differ on purpose.

### script.js owns behaviour, not text

`script.js` previously held a 147-entry translation map keyed by English source
strings, plus a text-node snapshot it restored on every language switch. That is
gone. It now only tracks the active language, sets `documentElement.lang`, and
dispatches `tonypony:languagechange`; `cms.js` listens for that event and
re-applies content. Do not reintroduce translated strings into `script.js` —
`content/*.json` is the single source of truth.

Project cards are re-rendered by `cms.js`, so anything that operates on them must
query the DOM at call time (as `getProjectCards()` does) rather than capture a
NodeList at load. The reveal-on-scroll observer only sees the original nodes,
which is why `cms.js` renders cards with `is-visible` already applied.

### Asset paths

Sveltia requires `public_folder` to be an absolute path, so
`admin/config.yml` hardcodes `/demo-company-page/assets/images` — the repository
name is baked into that one line. The page itself uses relative URLs so it works
from any path, and `toRelativeAsset()` in `cms.js` maps absolute managed paths
back to relative ones. **If the repository is renamed or moved to a custom
domain, update `public_folder`.**

## CMS authentication

Editors sign in with GitHub at `/admin/`; every save is a commit to `main`.
GitHub Pages cannot host an OAuth callback, so auth goes through a Cloudflare
Worker (`sveltia-cms-auth`) whose `ALLOWED_DOMAINS` secret only permits
`tonyponyrin.github.io`. Consequences:

- `/admin/` only works from the live URL. From localhost or `file://`, sign-in is
  refused with `UNSUPPORTED_DOMAIN`. That is the security boundary working.
- Token expiry is deliberately **off** on the GitHub OAuth app: the worker reads
  only `access_token` and ignores `refresh_token`, so expiring tokens would break
  saving after 8 hours with no refresh path.

Because editors commit directly to `main`, **the remote can move without you**.
Pull before editing `content/*.json`, or expect to rebase.

`CMS_SETUP.md` documents the full setup and the editing guide.

## Verifying changes

There is no test runner. What has been used, and is worth repeating for anything
touching content or config:

- Every `data-cms` / `data-cms-src` / `data-cms-alt` path in `index.html`
  resolves in all three locales.
- Field paths declared in `admin/config.yml` match `site.json` exactly — no
  declared-but-missing, no present-but-undeclared.
- All three locales have identical key shape, and no `th`/`zh` value is
  byte-identical to its `en` counterpart (that means untranslated).
- In a browser: content renders per locale, switching language and back does not
  lose CMS text, category filters still work on re-rendered cards, and the page
  survives `content/*.json` being unreachable.

Playwright with a local static server has been used for the browser checks;
Chromium is installed under `~/AppData/Local/ms-playwright`.

## Known issues

- The embedded Google Form in the contact section returns **401 to anonymous
  visitors**, so the public site shows an empty form area. Fix in Google Forms
  sharing settings, not in this repository.
- `assets/images/` contains 2-3MB PNGs. The CMS hints ask editors for images
  under 500KB, but the existing ones exceed that.
- `assets/images/Screenshot 2026-07-24 110313.png` was uploaded through the CMS
  and is not referenced by any content.

## AGENT/ directory

`AGENT/` holds a worker-agent coordination workflow (task table, decisions log,
worklog) from an earlier setup phase. Two caveats:

- `AGENT/STATE.md` is stale — it claims the repository has "no application
  source files yet".
- `AGENT/design.md` is a leftover template for an entirely different project (a
  "Flip7" card game design system). It has nothing to do with this site; the real
  visual design lives in `styles.css`.
