# Design Spec — SC Singhawat Concrete

Adapted from a reference construction-site design brief (ADU builder landing
page). Structure, typography scale, layout grammar, and components are kept
from that reference; the color palette is **not** — this site already has an
established concrete/industrial palette (see `styles.css:7-27`) that fits a
concrete-products manufacturer better than the reference's sage/mint palette,
which reads as a boutique residential builder. Colors below are the site's
real tokens, mapped onto the reference's roles.

This supersedes the previous contents of this file, which were an unrelated
Flip7 card-game design system left over from an earlier setup phase.

---

## 1. Design direction

An architectural, gallery-like site, tuned for a concrete/construction brand
rather than a boutique one. The mood is "quiet materials showroom" —
confidence from whitespace, typography, and the products themselves, not from
color or shadow. The one saturated color on the page is reserved for calls to
action.

Three moves carry the identity:

1. **A warm neutral page, white content.** The canvas is a warm off-white
   (`--paper`); content sits on it as a floating white sheet or on a slightly
   deeper warm band (`--paper-alt`) for section rhythm.
2. **A condensed display face for headlines, plain sans for everything
   else.** Headlines are large, tight, set in Barlow Condensed. Body copy is
   small and unstyled by comparison.
3. **One orange, used as the section accent.** `--orange` marks eyebrows
   (section kickers), stat values, work labels, nav hover, and the Get Quote
   CTA — it is the brand's single accent color, not a CTA-only color. It is
   still scarce in the sense the reference means: never a large fill, never a
   background, never body text — always small text or a control. Don't
   spread it further than this list without a reason.

Photography does the selling: concrete pours, finished surfaces, and
completed builds. Product imagery is die-cut (transparent background) per
`CLAUDE.md`; project/work photography can follow the reference's
dusk-exterior treatment once real photography replaces the placeholders.

---

## 2. Color tokens

These are the live tokens in `styles.css:7-16` — do not introduce a second
palette. Roles are annotated against the reference brief for translation
purposes only.

```css
--ink:         #1c1d1f;  /* headlines, nav — reference's --ink */
--ink-soft:    #4a4c50;  /* paragraph text — reference's --body */
--ink-faint:   #7a7d82;  /* meta text, disabled states — reference's --muted */
--paper:       #f6f4f1;  /* page canvas — reference's --canvas */
--paper-alt:   #ece9e4;  /* alternating section band — reference's --surface-alt */
--line:        #d8d4cd;  /* 1px hairlines, card borders — reference's --line */
--white:       #fff;     /* content sheet, cards — reference's --surface */
--orange:      #e2611c;  /* the section accent — eyebrows, labels, CTA fill */
--orange-dark: #c44f12;  /* CTA hover/active */
--orange-tint: #ffb98a;  /* orange on a dark ground, e.g. .eyebrow.light */
--error:       #c0392b;  /* form validation border */
--error-bg:    #fdf3f2;  /* form validation background */
```

Rules (carried from the reference, unchanged in spirit):

- No gradients. No colored drop shadows.
- `--orange` is small-text-or-control only — eyebrows, labels, stat values,
  nav hover, CTA fill — never a headline word, never a large fill, never body
  text. This is stricter than the reference (which also puts its accent on
  one headline word and on pill labels); here scarcity is about area, not
  about how many components may use it.
- `--error` / `--error-bg` exist only for the quote form's invalid-input
  state (`styles.css:910`). Don't reuse them for anything else without
  reconsidering whether it's actually an error state.
- If a soft-accent surface is needed later (a pill label, an active-state
  card background — see §5 Process steps), use a tint mixed from `--orange`
  at low opacity over `--paper`, not a new hue. Don't invent a second accent.
- Warmth on the page already comes from the palette itself (warm greys, not
  cool ones), unlike the reference where warmth comes only from photography.

---

## 3. Typography

Live faces, per `styles.css:23-24` — kept as-is, not replaced with the
reference's serif:

- **Display**: `"Barlow Condensed", "Noto Sans Thai", system-ui, sans-serif`
- **Sans (body/UI)**: `"Inter", "Noto Sans Thai", system-ui, -apple-system, sans-serif`

The reference's Didone-serif display face (Prata/Playfair) was considered and
rejected: it doesn't pair with the existing Thai/Chinese stacks as cleanly as
a condensed grotesque does, and this site already ships Barlow Condensed in
production. If a serif display treatment is wanted for a specific section
later, treat that as a new decision, not a silent merge.

| Role | Face | Notes |
| --- | --- | --- |
| Hero headline | display | large, tight leading, no accent word — see §1 |
| Section headline | display | same face, smaller size |
| Card / product title | sans | 500 weight |
| Body paragraph | sans | 400 weight, ~62 char max line length |
| Nav link | sans | 400 weight |
| Meta (unit, quantity) | sans | small, `--ink-faint` |

Thai and Chinese line-height and tracking overrides already exist in
`styles.css` (`html[lang="th"]` block) — see the reference's §9.2 table for
the reasoning (tone marks stack above/below the glyph in Thai; CJK needs
looser leading than Latin). Any new component should follow that existing
pattern rather than reintroducing per-component overrides.

---

## 4. Layout

- Content sheet: `--shell` (1180px) max-width, centered — matches the
  reference's 1180px content width.
- Section rhythm and corner radius: use `--radius` (14px) for cards/inputs;
  keep photography square-cornered (0px), same split as the reference —
  images stay architectural, UI stays soft.
- The reference's two-column alternating layout (text/image, flipped each
  section) already matches this site's product detail bands
  (`data-product-detail`), which are text-from-left, image-from-right by
  requirement — see `CLAUDE.md`'s "Scroll animation directions". Don't
  alternate that direction; it's a fixed client requirement, not a layout
  choice up for grabs.
- This site is one scrolling page with snap-to-section behavior (see
  `CLAUDE.md` "Full-page scrolling"), not the reference's freely-scrolling
  layout. Any new section must fit one screen (`min-height: 100svh`,
  `max-height: 100svh` where content is capped) — this constrains component
  sizing more than the reference brief assumes.

---

## 5. Components

Only introduce new components below where the current markup doesn't already
have an equivalent — check `index.html` and `styles.css` first.

**Buttons.**

- Primary (Get Quote): `--orange` fill, white text, `--radius` corners.
  Hover: `--orange-dark`.
- No icons inside buttons, no arrows appended to labels — matches reference.

**Floor-plan-style card → product/service card.** This site's six-card
product grid and detail bands already play this role (`data-product-grid`,
`data-product-detail`). If a future "build process" or "service" card is
added, follow the same card shell (`--white` on `--paper-alt`, `--radius`,
`--line` border) rather than inventing a new card style.

**Project card.** The Our Works gallery (`data-works-grid`, `#works`) already
plays this role. Square photo, no radius, matches reference.

**Process steps** (not yet built). If added later: a horizontal row of equal
columns on `--paper-alt`, one open at a time, using the low-opacity orange
tint from §2 for the active column background — not a new color.

**Language switcher.** Already implemented (`script.js` language handling).
Follow the reference's §9.4 guidance if restyled: text labels in their own
scripts, no flags, hairline divider, active at higher weight.

---

## 6. Motion and accessibility

- Reveal-on-scroll already exists (`data-reveal`, per `CLAUDE.md`) — don't
  duplicate it with a second page-load fade.
- Honor `prefers-reduced-motion: reduce`.
- Body text on white: verify contrast stays ≥ 4.5:1 with `--ink-soft`
  (#4a4c50 on #fff is well above that). `--ink-faint` is for meta/icons only,
  never for sentences — same rule as the reference's `--muted`.
- Visible focus ring on interactive elements and on square-cornered photo
  links.
- Mobile: grids collapse to one column, snap scrolling switches off below
  760px — see `CLAUDE.md` "Full-page scrolling" for the exact breakpoint
  behavior already implemented.

---

## 7. Trilingual system — TH / EN / ZH

This site's trilingual handling (`content/site.json` locales, `cms.js`,
`html[lang]` CSS overrides) already implements the reference's §9 concerns:
per-language line-height, no letter-spacing on Thai, per-locale numeral/unit
formatting via CMS content rather than hardcoded strings. Two reference
points worth keeping in mind for future work, since they're easy to get
wrong:

- **Never machine-split a headline into "accent word + rest."** This spec
  deliberately doesn't use an accent-word headline pattern (§1), which sidesteps
  the reference's requirement to store `accent`/`rest` as separate translated
  CMS fields — one less thing to keep in sync across `th`/`en`/`zh`.
- **Reserve extra room in any new text container.** Thai runs longer than
  English, Chinese runs shorter — any new component should be checked at all
  three locales before it's considered done, same as existing sections.
