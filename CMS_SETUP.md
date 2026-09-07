# CMS Setup

Content is edited through a git-based CMS. Every save is a commit to this
repository, which makes GitHub Pages redeploy the site.

- Editor UI: `https://tonyponyrin.github.io/demo-company-page/admin/`
- Editor config: [admin/config.yml](admin/config.yml)
- Content files: [content/site.json](content/site.json),
  [content/products.json](content/products.json),
  [content/projects.json](content/projects.json)

The editor is [Sveltia CMS](https://github.com/sveltia/sveltia-cms), which reads
Decap CMS configuration. To switch to Decap itself, replace the single script tag
in [admin/index.html](admin/index.html) — the config file needs no changes.

## How content reaches the page

`index.html` ships with English copy hardcoded. On load, `cms.js` fetches the
three JSON files and replaces:

| Markup hook | Meaning |
| --- | --- |
| `data-cms="hero.headline"` | replace text content with `site.json` → `<language>.hero.headline` |
| `data-cms-src="hero.slide1Image"` | replace the `src` attribute |
| `data-cms-alt="hero.slide1Alt"` | replace the `alt` attribute |
| `data-product-grid` | rebuild the product cards from `products.json` |
| `data-product-detail="readymix"` | fill one product detail band |
| `data-works-grid` | rebuild the Our Works cards from `projects.json` |

If a JSON file fails to load, the hardcoded English copy stays on screen and
nothing breaks.

## Language model

Three languages: `th` (default), `en`, `zh`.

`site.json` uses Decap's `single_file` i18n structure, so every locale sits at the
top level:

```json
{
  "th": { "hero": { "headline": "..." } },
  "en": { "hero": { "headline": "..." } },
  "zh": { "hero": { "headline": "..." } }
}
```

Image paths use `i18n: duplicate`, so the same value is written into all three
locales and the page can read it from whichever locale is active. The Google Form
ids under `quoteForm` use `i18n: duplicate` for the same reason.

`products.json` and `projects.json` deliberately do *not* use Decap i18n. Decap
ties list length to the default locale, which makes adding and reordering list
items fragile, so each entry carries explicit `title_th` / `title_en` / `title_zh`
fields instead.

## Setup — complete

GitHub Pages serves static files only, so it cannot host the OAuth callback the
editor needs to authenticate with GitHub. A small worker handles that. All five
steps below are done; they are kept as a record and for rebuilding from scratch.

### 1. Deploy the auth worker — DONE

Deployed at `https://sveltia-cms-auth.infition.workers.dev`, from a clone at
`d:\Project\sveltia-cms-auth` (kept outside this repository so it is not
committed here).

To redeploy after pulling worker updates:

```bash
cd d:\Project\sveltia-cms-auth
npm install
npx wrangler deploy
```

If `wrangler` reports you are not authenticated, run `npx wrangler login` on its
own first and let the browser redirect complete — do not chain it with another
command, and do not copy the callback URL out of the browser. The listener only
lives while `wrangler login` is running.

### 2. Create a GitHub OAuth app — DONE

GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**

```text
Application name:           Singhawat Concrete CMS
Homepage URL:               https://tonyponyrin.github.io/demo-company-page/
Authorization callback URL: https://sveltia-cms-auth.infition.workers.dev/callback
```

Registered as `tony-demo`. "Expire user access tokens" is deliberately off: the
worker reads only `access_token` and ignores `refresh_token`, so expiring tokens
would break saving after 8 hours with no refresh path.

### 3. Give the worker its secrets — DONE

From the `sveltia-cms-auth` directory:

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put ALLOWED_DOMAINS   # tonyponyrin.github.io
```

Or set the same three names in the Cloudflare dashboard under
Workers → `sveltia-cms-auth` → Settings → Variables.

### 4. Point the config at the worker — DONE

[admin/config.yml](admin/config.yml) already reads:

```yaml
backend:
  base_url: https://sveltia-cms-auth.infition.workers.dev
```

### 5. Enable GitHub Pages — DONE

Settings → Pages → Source `Deploy from a branch`, branch `main`, folder `/ (root)`.

Then open `/admin/` and sign in with GitHub. Anyone with write access to this
repository can edit; everyone else is refused.

## Editing

**Page Text** — every heading and paragraph, grouped by page section, with a
language tab per field. Also holds the Quotation form ids (below).

**Products** — the six concrete products. `Sort order` controls position in the
grid. **`Anchor` must stay one of** `readymix`, `slab`, `pile`, `pipe`,
`manhole`, `beam` — it is how a grid card finds its detail band on the page, and
changing it breaks the link silently. `Unit` is what the quotation form shows
next to Quantity when that product is chosen.

**Our Works** — one entry per project card in the gallery. `Sort order` controls
position, and `Category` must stay one of `house`, `office`, `road` so the three
"See Our Works" panels keep filtering correctly.

Image fields upload straight into `assets/images/` and are committed with the
content. Keep uploads under 500KB.

Saves commit to `main` directly. To review changes as pull requests instead, set
`publish_mode: editorial_workflow` in the config.

## Connecting the quotation form to Google Forms

The quotation modal is a custom form built into the page. It does not embed
Google Forms — it **posts to one**. Until the ids below are filled in,
submissions go nowhere.

1. Create a Google Form with five questions, in this order: Name, Product,
   Quantity, Construction site, Contact.
2. Open the live form in a browser, View Source, and search for `entry.` — each
   question has a name like `entry.123456789`.
3. Get the form id from the URL: `https://docs.google.com/forms/d/e/<FORM_ID>/viewform`.
4. In the CMS, open **Page Text → Quotation form** and paste in the form id and
   the five entry ids.

Two things to know:

- The form must be open to **anyone with the link**, not restricted to an
  organisation. The previous embedded form returned 401 to visitors for exactly
  this reason.
- The browser cannot read Google's response (it is a cross-origin `no-cors`
  post), so the page always shows a success message. Test by submitting once and
  checking the Google Sheet.

## Adding a new editable field

1. Add `data-cms="section.key"` to the element in `index.html`.
2. Add the value under all three locales in `content/site.json`.
3. Declare the field in the matching group in `admin/config.yml` with `i18n: true`.

The path in `data-cms` must match the nesting in `site.json` and the field names
in `config.yml` exactly, or the value silently falls back to the hardcoded copy.
