"""Browser checks. Serves the repo statically, then exercises the page."""
import subprocess, sys, time, socket
from playwright.sync_api import sync_playwright

PORT = 8731
BASE = f"http://127.0.0.1:{PORT}"

srv = subprocess.Popen(
    [sys.executable, "-m", "http.server", str(PORT)],
    cwd="d:/Project/demo-company-page",
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)

for _ in range(50):
    try:
        socket.create_connection(("127.0.0.1", PORT), 0.2).close()
        break
    except OSError:
        time.sleep(0.1)

problems = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1440, "height": 950})

        errors = []
        pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
        bad_requests = []
        pg.on("requestfailed", lambda r: bad_requests.append(r.url))
        pg.on("response", lambda r: bad_requests.append(f"{r.status} {r.url}") if r.status >= 400 else None)

        pg.goto(BASE, wait_until="networkidle")
        pg.wait_for_timeout(900)

        # --- default locale is Thai and CMS content applied
        lang = pg.get_attribute("html", "lang")
        if lang != "th":
            problems.append(f"default lang is {lang!r}, expected 'th'")
        h1 = pg.inner_text("h1")
        if "Concrete you can build" in h1:
            problems.append("hero headline still English fallback — cms.js did not apply")

        # --- product grid rebuilt from products.json
        cards = pg.locator(".product-card").count()
        if cards != 6:
            problems.append(f"product grid has {cards} cards, expected 6")

        # --- works grid rebuilt from projects.json
        works = pg.locator(".work-card").count()
        if works != 6:
            problems.append(f"works grid has {works} cards, expected 6")

        # --- product card anchors resolve to a real band
        for i in range(cards):
            href = pg.locator(".product-card").nth(i).get_attribute("href")
            if pg.locator(href).count() == 0:
                problems.append(f"product card links to {href}, which does not exist")

        # --- filters operate on re-rendered cards
        pg.click('[data-filter="road"]')
        pg.wait_for_timeout(250)
        visible = pg.locator(".work-card:not(.is-hidden)").count()
        if visible != 2:
            problems.append(f"road filter shows {visible} cards, expected 2")
        pg.click('[data-filter="all"]')
        pg.wait_for_timeout(200)

        # --- the sticky quote button is hidden over the hero, shown past it
        pg.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        pg.wait_for_timeout(600)
        if "is-shown" in (pg.get_attribute(".sticky-quote", "class") or ""):
            problems.append("sticky quote button visible over the hero (collides with hero CTA)")
        pg.locator("#products").scroll_into_view_if_needed()
        pg.wait_for_timeout(500)
        if "is-shown" not in (pg.get_attribute(".sticky-quote", "class") or ""):
            problems.append("sticky quote button never appeared after the hero")

        # --- hero's own Get Quote opens the modal too
        pg.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        pg.wait_for_timeout(500)
        pg.click(".hero-actions .btn-quote")
        pg.wait_for_timeout(400)
        if pg.locator("#quote-modal").is_hidden():
            problems.append("hero Get Quote did not open the modal")
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(250)

        # --- quote modal opens, dropdown populated, unit syncs
        pg.locator("#products").scroll_into_view_if_needed()
        pg.wait_for_timeout(500)
        pg.click(".sticky-quote")
        pg.wait_for_timeout(400)
        if pg.locator("#quote-modal").is_hidden():
            problems.append("quote modal did not open from the sticky button")
        opts = pg.locator("[data-quote-product-select] option").count()
        if opts != 7:
            problems.append(f"quote dropdown has {opts} options, expected 7 (placeholder + 6)")
        pg.select_option("[data-quote-product-select]", "readymix")
        pg.wait_for_timeout(200)
        unit = pg.inner_text("[data-quote-unit]")
        if unit != "m³":
            problems.append(f"unit for readymix is {unit!r}, expected 'm³'")
        pg.select_option("[data-quote-product-select]", "pipe")
        pg.wait_for_timeout(200)
        unit = pg.inner_text("[data-quote-unit]")
        if unit != "pcs":
            problems.append(f"unit for pipe is {unit!r}, expected 'pcs'")
        ref = pg.inner_text("[data-quote-ref]")
        if not ref.startswith("Q"):
            problems.append(f"quote ref not generated: {ref!r}")
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(300)
        if pg.locator("#quote-modal").is_visible():
            problems.append("Escape did not close the quote modal")

        # --- per-product Get Quote preselects that product
        pg.click('[data-quote-product="beam"]')
        pg.wait_for_timeout(400)
        sel = pg.input_value("[data-quote-product-select]")
        if sel != "beam":
            problems.append(f"beam Get Quote preselected {sel!r}, expected 'beam'")
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(200)

        # --- language switch, and switch back, keeps CMS text
        pg.click('.lang-btn[data-lang="en"]')
        pg.wait_for_timeout(500)
        if "Concrete you can build" not in pg.inner_text("h1"):
            problems.append("English headline missing after switching to en")
        if pg.locator(".product-card").count() != 6:
            problems.append("product cards lost after language switch")
        pg.click('.lang-btn[data-lang="zh"]')
        pg.wait_for_timeout(500)
        zh_nav = pg.inner_text('.site-nav a[data-cms="nav.about"]')
        if zh_nav != "关于我们":
            problems.append(f"zh nav shows {zh_nav!r}")
        pg.click('.lang-btn[data-lang="th"]')
        pg.wait_for_timeout(500)
        th_nav = pg.inner_text('.site-nav a[data-cms="nav.about"]')
        if th_nav != "เกี่ยวกับเรา":
            problems.append(f"th nav after round trip shows {th_nav!r}")

        # --- contact links wired from content
        tel = pg.get_attribute("[data-rail-phone]", "href")
        if tel != "tel:0866743858":
            problems.append(f"rail phone href is {tel!r}")

        # --- reveals actually fire
        pg.evaluate("window.scrollTo({top:document.body.scrollHeight/2,behavior:'instant'})")
        pg.wait_for_timeout(900)
        hidden = pg.evaluate(
            "Array.from(document.querySelectorAll('[data-reveal]'))"
            ".filter(e=>{const r=e.getBoundingClientRect();"
            "return !e.classList.contains('is-visible') && r.top < innerHeight && r.bottom > 0;})"
            ".map(e=>e.className+'|'+Math.round(e.getBoundingClientRect().top))"
        )
        if hidden:
            problems.append(f"elements in view but not revealed: {hidden}")

        # --- reveals must still be pending while an element is entering view.
        # Regression guard: an over-eager rescue sweep once revealed everything
        # the instant its top edge crossed the bottom of the screen, so every
        # slide-in played off-screen and the page looked unanimated.
        pg.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        pg.wait_for_timeout(600)
        pg.reload(wait_until="networkidle")
        pg.wait_for_timeout(900)
        entering = pg.evaluate(
            """() => {
                const el = document.querySelector('#products [data-reveal]');
                const top = el.getBoundingClientRect().top + scrollY;
                // put the element's top just inside the bottom edge of the screen
                window.scrollTo({top: top - innerHeight + 30, behavior: 'instant'});
                return new Promise(r => setTimeout(() =>
                    r(el.classList.contains('is-visible')), 350));
            }"""
        )
        if entering:
            problems.append("element revealed the moment it touched the screen edge — "
                            "slide-in animation plays off-screen")
        arrived = pg.evaluate(
            """() => {
                const el = document.querySelector('#products [data-reveal]');
                el.scrollIntoView({block: 'center', behavior: 'instant'});
                return new Promise(r => setTimeout(() =>
                    r(el.classList.contains('is-visible')), 500));
            }"""
        )
        if not arrived:
            problems.append("element never revealed after scrolling it into view")

        # --- full-page scrolling: one wheel gesture advances one whole section
        pg.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        pg.wait_for_timeout(600)
        tops = pg.evaluate(
            "Array.from(document.querySelectorAll('main > section'))"
            ".map(s => Math.round(s.getBoundingClientRect().top + scrollY))"
        )
        for i in range(4):
            before = pg.evaluate("scrollY")
            pg.mouse.wheel(0, 400)
            pg.wait_for_timeout(1100)
            after = pg.evaluate("scrollY")
            nearest = min(tops, key=lambda t: abs(t - after))
            if abs(nearest - after) > 6:
                problems.append(
                    f"wheel step {i + 1} landed at {after}, not on a section top "
                    f"(nearest {nearest})"
                )
                break
            if after <= before:
                problems.append(f"wheel step {i + 1} did not advance (stayed at {after})")
                break
            # one gesture must move exactly one section, not several
            skipped = [t for t in tops if before < t < after]
            if len(skipped) > 1:
                problems.append(f"wheel step {i + 1} skipped {len(skipped)} sections at once")
                break

        # --- no section should overflow its own screen on desktop
        overflow = pg.evaluate(
            """() => Array.from(document.querySelectorAll('main > section'))
                .map(s => ({id: s.id || s.className.split(' ')[0],
                            over: Math.round(s.scrollHeight - innerHeight)}))
                .filter(x => x.over > 8)"""
        )
        if overflow:
            problems.append(f"sections taller than one screen: {overflow}")

        # --- card contents must stay inside their card. Flex-shrinking a caption
        # below its text height lets the text spill out over the row beneath.
        spill = pg.evaluate(
            """() => {
                const out = [];
                document.querySelectorAll('.product-card, .work-card').forEach(card => {
                    const c = card.getBoundingClientRect();
                    card.querySelectorAll('h3, .work-body, img').forEach(el => {
                        const r = el.getBoundingClientRect();
                        if (r.bottom > c.bottom + 2 || r.top < c.top - 2)
                            out.push((card.className.split(' ')[0]) + ' > ' +
                                     el.tagName.toLowerCase() + ' by ' +
                                     Math.round(r.bottom - c.bottom) + 'px');
                    });
                });
                return out;
            }"""
        )
        if spill:
            problems.append(f"content overflowing its card: {spill[:4]}")

        # --- anchor navigation is smooth, not a jump
        beh = pg.evaluate("getComputedStyle(document.documentElement).scrollBehavior")
        if beh != "smooth":
            problems.append(f"html scroll-behavior is {beh!r}, expected 'smooth'")

        # --- screenshots
        pg.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        pg.wait_for_timeout(500)
        pg.screenshot(path="_page-desktop.png", full_page=True)

        pg.locator("#products").scroll_into_view_if_needed()
        pg.wait_for_timeout(400)
        pg.click(".sticky-quote")
        pg.wait_for_timeout(500)
        pg.screenshot(path="_modal.png")
        pg.keyboard.press("Escape")

        m = b.new_page(viewport={"width": 390, "height": 844})
        m.goto(BASE, wait_until="networkidle")
        m.wait_for_timeout(900)
        m.screenshot(path="_page-mobile.png", full_page=True)

        # --- resilience: content unreachable, inline English must survive
        f = b.new_page()
        f.route("**/content/*.json", lambda route: route.abort())
        f.goto(BASE, wait_until="load")
        f.wait_for_timeout(700)
        if f.locator(".product-card").count() != 6:
            problems.append("page broke when content/*.json was unreachable")
        if "Concrete you can build" not in f.inner_text("h1"):
            problems.append("inline English fallback missing when JSON unreachable")

        real_errors = [e for e in errors if "content/" not in e and "Failed to load resource" not in e]
        if real_errors:
            problems.append("console errors: " + " | ".join(real_errors[:5]))
        real_bad = [r for r in bad_requests if "content/" not in r and "google" not in r]
        if real_bad:
            problems.append("failed requests: " + " | ".join(sorted(set(real_bad))[:5]))

        b.close()
finally:
    srv.terminate()

print()
if problems:
    for p_ in problems:
        print("FAIL ", p_)
    print(f"\n{len(problems)} problems")
    sys.exit(1)
print("all browser checks passed")
