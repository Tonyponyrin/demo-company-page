# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page static site for **SC Singhawat Concrete** — a concrete products
manufacturer with a construction arm (Singhawat Builders) — in Thai, English,
and Chinese. No build step, no package.json, no test framework, no dependencies
to install. GitHub Pages serves the repository root of `main`, so **a push to
`main` is a deploy** (live about 40 seconds later).

Live: https://tonyponyrin.github.io/demo-company-page/

The current copy and photography are **mock content**, standing in until the
client supplies real text and photos. The structure, however, is the real
requirement — it comes from the client's hand-drawn wireframes, kept as
`design-contact-sheet.jpg` in the repository root and documented in
[REQUIREMENTS.md](REQUIREMENTS.md). Read that before changing page structure.

> Historical note: this repository previously held an unrelated demo for a
> fictional design studio ("Tonypony's Company"). That site is gone. If you find
> a reference to Approach / Services / Process / Studio sections, or to
> `interior-design.png`, it is a leftover and should be removed.

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

## Page structure

One page, five anchors, in this order. The nav has exactly four links plus the
three language flags; do not add a fifth link without checking REQUIREMENTS.md.

| Anchor | Contents |
| --- | --- |
| `#top` | Hero slideshow (3 slides, prev/next) |
| `#about` | Four bands: intro triple-slideshow, History, Vision & Mission, Policy |
| `#products` | 6-card product grid, then one detail band per product |
| `#projects` | Singhawat Builders intro, 3 pitch panels, then `#works` gallery |
| `#contact` | Phone / LINE / Facebook, office map, footer |

Two elements are **global chrome, present on every screen**: the sticky orange
Get Quote button (bottom-left) and the sticky social rail (right edge, FB / LINE
/ phone). Every Get Quote button on the page — the sticky one and the per-product
ones — opens the same quotation modal.

The six products are fixed and their detail-band ids are referenced from the grid
cards: `#product-readymix`, `#product-slab`, `#product-pile`, `#product-pipe`,
`#product-manhole`, `#product-beam`.

The three project pitch panels are Build Your Dream House, Build Your Office, and
Build Your Way (concrete road construction). All three "See Our Works" links go to
the single `#works` gallery — they are not three separate galleries.

## Full-page scrolling

Every wireframe frame is one full screen with "Scroll down" between it and the
next, so **one wheel gesture advances exactly one section**, and the section
lands before its contents animate in. Three pieces make that work, and removing
any one of them breaks it:

1. **CSS snap points** — `scroll-snap-type: y mandatory` on `html`, with
   `scroll-snap-align: start` and `scroll-snap-stop: always` on every
   `main > section`. The footer uses `scroll-snap-align: end` because it is
   shorter than a screen.
2. **A wheel handler in `script.js`** — CSS snapping alone is not enough. One
   wheel notch is a small delta, so the browser snaps *back* to the section you
   are already on and the page feels stuck. `onWheel` moves to the next snap
   position instead. It deliberately does nothing on touch, on keyboard, below
   760px, while the quote modal is open, or inside a section taller than the
   screen.
3. **Sections that fit one screen** — `min-height: 100svh` on each section. The
   products and works grids also carry `max-height: 100svh` plus a flex chain
   (`section > .shell > .grid > .card > img`) so the card images absorb the
   spare height and the section fits any screen height. `min-height` alone is a
   floor, so without the cap the section just grows and the cards never shrink.

Two traps that already caused bugs here:

- A full-bleed background image left in normal flow sets its own height from its
  aspect ratio, making the section taller than one screen and breaking the snap
  point. `.hero .slides` and `.pitch-bg` are absolutely positioned for exactly
  this reason.
- Card captions must be `flex: none`. Otherwise they are shrunk below their text
  height and the text spills out over the row beneath.

Below 760px the grids collapse to one column and most sections become several
screens tall, so snapping is switched off entirely and the page scrolls
normally. The mobile overrides are scoped the same way as the desktop rules
(`.products-section .product-card`, not `.product-card`) — at equal specificity
the later rule in the file wins, and these rules are not in file order.

`tools/browser-check.py` guards all of this: one wheel gesture must land on a
section top, advance, and not skip; no section may exceed one screen; no card
content may overflow its card.

## Content architecture

Three layers that must stay in agreement:

1. **`index.html`** carries English copy inline as a fallback, plus hooks:
   - `data-cms="hero.headline"` — replace the element's text
   - `data-cms-src` / `data-cms-alt` — replace an image's `src` / `alt`
   - `data-product-grid` — container the product cards are rebuilt into
   - `data-product-detail="readymix"` — a product's detail band
   - `data-works-grid` — container the Our Works cards are rebuilt into
2. **`content/site.json`**, **`content/products.json`**, and
   **`content/projects.json`** hold every string in all three languages.
3. **`cms.js`** fetches all three files and applies them over the DOM. If a fetch
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

`products.json` and `projects.json` deliberately do **not** use Decap i18n. Decap
ties list length to the default locale, which makes adding and reordering list
items fragile, so each entry carries explicit `title_th` / `title_en` / `title_zh`
fields instead. Do not "unify" these two approaches; they differ on purpose.

### Slideshows use numbered slots, not lists

The hero, the About intro, and the History band are slideshows. Their slides are
**fixed numbered fields** (`hero.slide1Image`, `hero.slide2Image`, …), not list
widgets. Same reasoning as above: a Decap list inside an i18n file is fragile,
and these slideshows have a designed slide count anyway. To change how many
slides a band has, edit the markup and add the matching numbered fields — do not
convert it to a list.

### script.js owns behaviour, not text

`script.js` tracks the active language, sets `documentElement.lang`, and
dispatches `sc:languagechange`; `cms.js` listens for that event and re-applies
content. Do not put translated strings into `script.js` — `content/*.json` is the
single source of truth.

`script.js` also owns the slideshows, the scroll-reveal directions, the quote
modal, and the works carousel. Product cards and works cards are re-rendered by
`cms.js`, so anything that operates on them must query the DOM at call time
rather than capture a NodeList at load. The reveal-on-scroll observer only sees
the original nodes, which is why `cms.js` renders cards with `is-visible` already
applied.

### Scroll animation directions

The sketches specify direction per element, and the markup encodes it:
`data-reveal="left"` (slides in from the left), `"right"`, `"up"`, `"down"`.
Product detail bands are always text-from-left, image-from-right. Respect the
existing direction attributes; they are a client requirement, not decoration.

## The quotation form

The single highest-value feature on the page, and the reason the site exists.

It is a **custom-built form that posts to a Google Form**, not an embedded
Google Form iframe. The old embed returned 401 to anonymous visitors and could
not be styled; this replaces it.

How it works:

1. The modal collects Name, Product, Quantity (+ unit), Construction site, Contact.
2. The Product dropdown is built from `products.json` at runtime.
3. Choosing a product **sets the quantity unit automatically** from that product's
   `unit` field (e.g. Ready-Mixed Concrete → `m³`). This is a client requirement.
4. Submitting POSTs `application/x-www-form-urlencoded` to
   `https://docs.google.com/forms/d/e/<formId>/formResponse` with `mode: 'no-cors'`.

Because `no-cors` makes the response opaque, **the page cannot tell whether the
submission succeeded**. It optimistically shows a success state. That is the
accepted trade-off for posting to Google Forms from a static site; do not add
error handling that pretends to know better.

The form id and the `entry.NNNNNN` field ids live in `site.json` under
`quoteForm`, with `i18n: duplicate`, so an editor can paste them in from the CMS
without a code change. **They are placeholders until the client creates the real
Google Form** — see REQUIREMENTS.md for how to find the entry ids.

## Asset paths and die-cut images

Sveltia requires `public_folder` to be an absolute path, so `admin/config.yml`
hardcodes `/demo-company-page/assets/images` — the repository name is baked into
that one line. The page itself uses relative URLs so it works from any path, and
`toRelativeAsset()` in `cms.js` maps absolute managed paths back to relative ones.
**If the repository is renamed or moved to a custom domain, update
`public_folder`.**

Product imagery is **die-cut**: the product on a transparent background, no
backdrop, so it can sit on any section colour. The placeholders in
`assets/images/diecut/` are SVGs generated for this mock-up. When real
photography arrives it should be cut out the same way and saved as transparent
PNG or WebP, and the paths updated in `products.json`.

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

There is no test framework, but there are two scripts. Run both after touching
content, config, or markup:

```bash
python tools/verify-content.py    # the three-way invariant, statically
python tools/browser-check.py     # serves the site and drives it in Chromium
```

`verify-content.py` checks every item in the list below that can be checked
without a browser, and exits non-zero on failure. `browser-check.py` starts a
local server on port 8731, exercises the page, and leaves screenshots named
`_*.png` in the repository root (gitignored). It needs Playwright with Chromium,
already installed under `~/AppData/Local/ms-playwright`.

A third script, `tools/generate-images.py`, regenerates the placeholder SVGs in
`assets/images/`. Run it from the repository root, not from `tools/` — it writes
paths relative to the working directory.

What the two scripts cover:

- Every `data-cms` / `data-cms-src` / `data-cms-alt` path in `index.html`
  resolves in all three locales.
- Field paths declared in `admin/config.yml` match `site.json` exactly — no
  declared-but-missing, no present-but-undeclared.
- All three locales have identical key shape, and no `th`/`zh` value is
  byte-identical to its `en` counterpart (that means untranslated).
- Every `#product-*` anchor referenced by a product card exists in the markup.
- In a browser: content renders per locale, switching language and back does not
  lose CMS text, the quote modal opens from every Get Quote button, choosing a
  product updates the unit, and the page survives `content/*.json` being
  unreachable.

Playwright with a local static server has been used for the browser checks;
Chromium is installed under `~/AppData/Local/ms-playwright`.

## Known issues

- **The Google Form is not connected yet.** `quoteForm.formId` and the entry ids
  in `site.json` are placeholders, so submissions go nowhere until the client
  creates the form and the ids are filled in.
- All copy and imagery is mock content pending the client's real material.
- Product and project imagery is placeholder SVG, not photographs. The sketches
  specifically ask for real photos — volume shots and close-ups of the concrete
  surface — and note that the reinforced pipe shot is undecided between stacked
  and single.
- The office map is a placeholder embed. The client asked for a 3D map view.

## AGENT/ directory

`AGENT/` holds a worker-agent coordination workflow (task table, decisions log,
worklog) from an earlier setup phase. Two caveats:

- `AGENT/STATE.md` is stale — it claims the repository has "no application
  source files yet".
- `AGENT/design.md` is a leftover template for an entirely different project (a
  "Flip7" card game design system). It has nothing to do with this site; the real
  visual design lives in `styles.css`.
