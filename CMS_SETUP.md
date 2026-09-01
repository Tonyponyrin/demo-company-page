# CMS Setup

Content is edited through a git-based CMS. Every save is a commit to this
repository, which makes GitHub Pages redeploy the site.

- Editor UI: `https://tonyponyrin.github.io/demo-company-page/admin/`
- Editor config: [admin/config.yml](admin/config.yml)
- Content files: [content/site.json](content/site.json), [content/projects.json](content/projects.json)

The editor is [Sveltia CMS](https://github.com/sveltia/sveltia-cms), which reads
Decap CMS configuration. To switch to Decap itself, replace the single script tag
in [admin/index.html](admin/index.html) — the config file needs no changes.

## How content reaches the page

`index.html` ships with English copy hardcoded. On load, `cms.js` fetches the two
JSON files and replaces:

| Markup hook | Meaning |
| --- | --- |
| `data-cms="hero.headline"` | replace text content with `site.json` → `<language>.hero.headline` |
| `data-cms-src="hero.image"` | replace the `src` attribute |
| `data-cms-alt="hero.imageAlt"` | replace the `alt` attribute |
| `data-project-grid` | rebuild the project cards from `projects.json` |

If either JSON file fails to load, the hardcoded English copy stays on screen and
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
locales and the page can read it from whichever locale is active.

`projects.json` deliberately does *not* use Decap i18n. Decap ties list length to
the default locale, which makes adding and reordering list items fragile, so each
project carries explicit `title_th` / `title_en` / `title_zh` fields instead.

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
Application name:           Tonypony CMS
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

**Site Text** — every heading and paragraph, grouped by page section, with a
language tab per field.

**Portfolio** — one entry per project card. `Sort order` controls position
(lower first), `Category` must stay one of `home`, `commercial`, `interior` so the
filter buttons keep working, and `Image` uploads straight into `assets/images/`
and is committed with the content.

Saves commit to `main` directly. To review changes as pull requests instead, set
`publish_mode: editorial_workflow` in the config.

## Adding a new editable field

1. Add `data-cms="section.key"` to the element in `index.html`.
2. Add the value under all three locales in `content/site.json`.
3. Declare the field in the matching group in `admin/config.yml` with `i18n: true`.

The path in `data-cms` must match the nesting in `site.json` and the field names
in `config.yml` exactly, or the value silently falls back to the hardcoded copy.

## Known issue, unrelated to the CMS

The embedded Google Form in the contact section returns HTTP 401 to anonymous
visitors, so the public site shows an empty form area. Fix it in Google Forms:
Settings → Responses → make the form open to anyone with the link, not restricted
to an organisation.
