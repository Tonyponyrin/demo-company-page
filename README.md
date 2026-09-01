# Tonypony's Company Demo Site

Static demo website for a fictional design, architecture, and building company.

## GitHub Pages

This project has no build step. Publish the repository with GitHub Pages using:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

The site uses relative paths, so it works from a repository path such as
`https://tonyponyrin.github.io/demo-company-page/`.

## Editing content

Copy, images, and portfolio entries are edited in the browser at `/admin/` and
saved as commits to this repository. See [CMS_SETUP.md](CMS_SETUP.md) for the
one-time auth setup and the editing guide.

## Files

- `index.html` - page structure, with English copy as built-in fallback
- `styles.css` - responsive visual design
- `script.js` - mobile nav, project filters, active language
- `cms.js` - applies `content/*.json` to the page
- `content/site.json` - all page copy in Thai, English, and Chinese
- `content/projects.json` - portfolio cards
- `admin/` - CMS editor page and field configuration
- `CMS_SETUP.md` - CMS setup and editing instructions
- `assets/images/` - local demo imagery and CMS uploads
