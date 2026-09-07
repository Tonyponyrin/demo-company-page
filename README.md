# SC Singhawat Concrete

Static website for a concrete products manufacturer and its construction arm,
Singhawat Builders. Thai, English, and Chinese. No build step.

Copy and imagery are currently **mock content**, pending the client's real text
and photography. The page structure is final and comes from the client's
wireframes — see [REQUIREMENTS.md](REQUIREMENTS.md).

## Preview locally

```bash
python -m http.server 8000     # then open http://localhost:8000
```

Do not open `index.html` directly as a file — the browser blocks the content
fetches and the page falls back to its built-in English copy.

## GitHub Pages

No build step. Published with:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

A push to `main` is a deploy. The site uses relative paths, so it works from a
repository subpath such as `https://tonyponyrin.github.io/demo-company-page/`.

## Editing content

Copy, images, products, and project entries are edited in the browser at
`/admin/` and saved as commits to this repository. See
[CMS_SETUP.md](CMS_SETUP.md) for the auth setup and the editing guide.

## Files

- `index.html`, `about.html`, `products.html`, `projects.html`, `contact.html`
  — the five pages, with English copy as built-in fallback. Shared header,
  footer and modal are duplicated and kept in step by `tools/sync-chrome.py`;
  edit them in `index.html` only
- `styles.css` — responsive visual design
- `script.js` — nav, language switch, slideshows, scroll reveals, quote modal
- `cms.js` — applies `content/*.json` to the page
- `content/site.json` — all page copy in Thai, English, and Chinese
- `content/products.json` — the six concrete products
- `content/projects.json` — Our Works gallery cards
- `admin/` — CMS editor page and field configuration
- `tools/` — content checks, browser checks, and the placeholder image generator
- `assets/images/diecut/` — die-cut product images (transparent background)
- `design-contact-sheet.jpg` — the client's wireframes, all 23 frames
- `REQUIREMENTS.md` — what the page must contain, transcribed from those frames
- `CLAUDE.md` — how the code is arranged to deliver it

## Checks

```bash
python tools/sync-chrome.py       # push shared chrome from index.html to the other pages
python tools/verify-content.py    # copy, config, and markup agree in all 3 languages
python tools/browser-check.py     # drives the page in Chromium (needs Playwright)
```

## Outstanding

- The quotation form posts to a Google Form that does not exist yet; the form id
  and field ids in `content/site.json` are placeholders.
- All copy is mock; all imagery is placeholder SVG.
