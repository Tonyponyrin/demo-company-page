# Requirements — SC Singhawat Concrete website

Transcribed from the client's hand-drawn wireframes (23 frames, drawn 4 Sep 2026).
The montage of all frames is `design-contact-sheet.jpg` in the repository root;
the originals are the `LINE_ALBUM_Website_260907_*.jpg` set.

This file is the source of truth for **what the page must contain**. `CLAUDE.md`
describes how the code is arranged to deliver it. Where the two disagree, the
sketches win — but update both.

Frame numbers below refer to the `_N` suffix on the original filenames.

## The frames are five pages, not one scroll

The yellow highlights are page labels and the red arrows between columns are nav
clicks. Frames stack vertically within a column, chained by "Scroll down".

| Page | Frames | Yellow label |
| --- | --- | --- |
| Main | 1-5 | `Main Page` |
| About Us | 6-9 | `Click : About US` |
| Our Products | 10-16 | `Click Our Products` |
| Our Project | 17-22 | `Click Our Construction site` |
| Contact Us | 23 | `Click Contact US` |

The Main page scroll order is hero (1), the six-card **Our Products grid** (2),
the works gallery (3), the **quotation** (4), then contact and footer (5). Note
that the product grid lives here, not on the products page, and that contact
appears both here and as its own page.

---

## Global chrome — on every screen

Every one of the 23 frames shows all of these, so they are page furniture, not
section content.

| Element | Position | Behaviour |
| --- | --- | --- |
| `SC Singhawat Concrete` logo | top-left | scrolls to top |
| Nav: About Us · Our Products · Our Project · Contact Us | top-centre | anchors |
| Three flags 🇺🇸 🇹🇭 🇨🇳 | top-right | language switch |
| **Get Quote** (orange pill) | bottom-left, sticky | opens the quotation modal |
| Social rail: FB · LINE · phone | right edge, sticky | chat / call |

The nav is exactly four links. Frames 1–23 never show a fifth.

## Scroll behaviour

**Full-page scrolling.** Every frame is drawn as one bordered full screen, with
`Scroll down` between it and the next. One scroll gesture therefore advances one
whole section, which lands before its contents animate in. This is the page's
basic movement, not an effect layered on top.

From the Vision & Mission band downward (frame 8), sections **animate in as they
land**, in sequence. Direction is specified per element and is not decorative:

- Product detail bands: heading and body **slide in left → right**, product photo
  **slides in right → left** (frames 12–16, annotated on every one).
- Section headings elsewhere: slide in from the top (frame 8).

---

## 1. Home — hero (frames 1, 3)

- Full-width **image slideshow** with `Previous` / `Next` arrows.
- Slide content, per the Thai note on frame 1: plant, batch plant, mixer truck,
  concrete pouring. Wide shots that read at a glance.
- **Alternative the client raised:** a video of operations and products instead
  of the slideshow. Built as a slideshow for now; a video slot would replace it.
- Below the hero (frame 3): a **project gallery slideshow** that auto-advances
  right → left, each slide captioned with the project name, and clickable.

## 2. About Us (frames 6–9)

Four bands, in this order.

**2a. Intro (frame 6)** — three slideshows that run **simultaneously**:
1. Plant and mixer-truck photos
2. `ประสบการณ์กว่า 30 ปี` — 30+ years of experience
3. The company slogan / quote

**2b. Our History (frame 7)** — `ประวัติความเป็นมา`. Photo slideshow on the left,
body text on the right, two slide positions. Client note: *"อีกใจอยากทำเป็นวิดีโอ"*
— they are half-considering a video here too.

**2c. Vision & Mission (frame 8)** — `วิสัยทัศน์ และ พันธกิจ`, two columns side by
side. The heading slides down from the top. This is where sequenced scroll
animation starts.

**2d. Our Policy (frame 9)** — `นโยบาย`. Team photo on the left, bulleted policy
text on the right.

## 3. Our Products (frames 2, 10–16)

**3a. Grid (frame 2)** — six cards, each an image plus a name, each **clickable**
and jumping to that product's detail band:

| Product | Anchor | Quote unit |
| --- | --- | --- |
| Ready-Mixed Concrete | `#product-readymix` | m³ |
| Precast Concrete Slab | `#product-slab` | pcs |
| Precast Concrete Pile | `#product-pile` | pcs |
| Reinforced Concrete Pipe | `#product-pipe` | pcs |
| Reinforced Concrete Manhole | `#product-manhole` | pcs |
| Reinforced Concrete Beam | `#product-beam` | pcs |

**3b. Landing band (frame 10)** — a large lead image with the product name
captioned, "click to slide down" into the detail bands.

**3c. Detail bands (frames 11–16)** — one per product, all the same shape:
heading + description sliding in from the left, die-cut product photo sliding in
from the right, and its **own Get Quote button**.

Client notes on imagery:
- Frame 11 (ready-mixed): wants photos that give a sense of **volume**, or a
  **close-up of the concrete surface** — the sketch alone is too plain.
- Frame 14 (pipe): undecided whether pipes are shown **stacked** or **single**.

## 4. Our Project (frames 17–22)

**4a. Singhawat Builders intro (frame 17)** — team photo with the construction
arm's name and a description of what they build.

**4b. Three pitch panels** — each a headline over a hero image, with a
`→ See Our Works ←` link:

| Frame | Headline | Subject |
| --- | --- | --- |
| 18 | Build Your Dream House | housing |
| 19 | Build Your Office | commercial buildings |
| 20 | Build Your Way | concrete road construction |

Two naming questions were written in red and are now **resolved**:
- Frame 19: the client weighed "Build Your Building" against "Build Your Office"
  and kept **Build Your Office**.
- Frame 20: left open on the sketch (*"ยังไม่รู้จะใช้คำว่าอะไรดี"*), since settled as
  **Build Your Way**, subtitled *concrete road construction*.

**4c. Our Works gallery (frame 21)** — all three "See Our Works" links land here,
on **one shared gallery**, not three. Six cards in a grid that slides
horizontally, with "click to see more".

**4d. Project detail (frame 22)** — project name, then an image carousel with
`‹` / `›` arrows.

## 5. Contact Us (frames 5, 23)

- Phone `086-6743858` and `081-6743858` — **click to call**.
- LINE `@SinghawatConcrete` — **click to chat**.
- Facebook page — **click to chat**.
- **Our Office**: address text, written directions, and an embedded Google Map.
  Client note: *"อยากได้ 3D Map"* — they want the 3D map view.
- Footer: company logo, full company name, slogan/quote, and phone / Facebook /
  LINE links.

---

## 6. The quotation form (frame 4)

Opens as a **modal**, from any Get Quote button. The Thai note is explicit that
everything appears at once as a pop-up.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| Name | text | |
| Product | **dropdown** | "click to choose"; options come from the product list |
| Quantity | number + unit | the **unit syncs to the chosen product** |
| Construction site | text | where the customer wants delivery |
| Contact | text | phone or LINE |

The quantity example on the sketch is `Concrete 210 KSC → 100 (m³)`, which is
where the per-product `unit` field comes from.

**Design requirement, written in red:** the client does not want a plain stack of
bordered inputs. They want it to *look like a real quotation document* —
*"อยากให้ดีไซน์เหมือนการทำเอกสารใบเสนอราคา ไม่อยากแค่มีกรอบและช่องกรอกข้อมูล"*. So the modal is
styled as a quotation sheet: document header, company block, ruled line items.

### Where submissions go

A custom form that **posts to a Google Form**. The client will restyle their
existing Google Form to match these fields.

To connect it:

1. Create the Google Form with the five questions above, in that order.
2. Open the live form, View Source, and search for `entry.` — each question has
   an `entry.NNNNNNNNN` name.
3. Take the form id from the response URL:
   `https://docs.google.com/forms/d/e/<FORM_ID>/formResponse`.
4. Paste the form id and the five entry ids into the CMS under
   **Page Text → Quotation form**, or directly into `content/site.json` under
   `quoteForm`.

Until then the fields hold `PLACEHOLDER` and submissions go nowhere. The page
cannot detect this — see the `no-cors` note in CLAUDE.md.

---

## Status of this build

| Requirement | State |
| --- | --- |
| Page structure, all five sections | built |
| Full-page scrolling, one gesture per section | built (desktop; off below 760px) |
| Global chrome, sticky quote + social rail | built |
| Scroll-in animations with per-element direction | built |
| Product grid, 6 detail bands, anchor jumps | built |
| Quotation modal, product-driven units | built |
| Google Form connection | **placeholder ids — needs the client's form** |
| Copy in Thai / English / Chinese | **mock content** |
| Photography | **placeholder die-cut SVG, needs real photos** |
| 3D office map | **placeholder embed** |
| Hero as video instead of slideshow | not built — client undecided |
