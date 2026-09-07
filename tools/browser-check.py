"""Serve the site locally and drive all five pages in Chromium.

    python tools/browser-check.py

Leaves screenshots named _*.png in the repository root (gitignored).
"""
import subprocess
import sys
import time
import socket
from playwright.sync_api import sync_playwright

PORT = 8731
BASE = f"http://127.0.0.1:{PORT}"
PAGES = ["index.html", "about.html", "products.html", "projects.html", "contact.html"]

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


def note(msg):
    problems.append(msg)


def instant_top(pg):
    pg.evaluate("window.scrollTo({top:0,behavior:'instant'})")
    pg.wait_for_timeout(400)


try:
    with sync_playwright() as p:
        b = p.chromium.launch()

        # ------------------------------------------------ every page, shared
        for name in PAGES:
            pg = b.new_page(viewport={"width": 1440, "height": 950})
            errors, bad = [], []
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
            pg.on("response", lambda r: bad.append(f"{r.status} {r.url}") if r.status >= 400 else None)
            pg.on("requestfailed", lambda r: bad.append("FAILED " + r.url))

            pg.goto(f"{BASE}/{name}", wait_until="networkidle")
            pg.wait_for_timeout(900)

            if pg.get_attribute("html", "lang") != "th":
                note(f"{name}: default language is not Thai")

            # the shared chrome must be present and wired on every page
            for sel in [".site-header", ".site-nav", ".lang-switch", ".site-footer",
                        ".sticky-quote", ".social-rail", "#quote-modal"]:
                if pg.locator(sel).count() == 0:
                    note(f"{name}: missing chrome {sel}")

            # the nav marks the page you are on
            current = pg.locator(".site-nav a.is-current").count()
            expected = 0 if name == "index.html" else 1
            if current != expected:
                note(f"{name}: {current} nav links marked current, expected {expected}")

            # the quote modal opens and its dropdown is populated from products.json
            pg.locator("#products, #main").first.scroll_into_view_if_needed()
            pg.wait_for_timeout(400)
            pg.evaluate("document.querySelector('.sticky-quote').classList.add('is-shown')")
            pg.click(".sticky-quote")
            pg.wait_for_timeout(400)
            if pg.locator("#quote-modal").is_hidden():
                note(f"{name}: quote modal did not open")
            opts = pg.locator("#quote-modal [data-quote-product-select] option").count()
            if opts != 7:
                note(f"{name}: modal dropdown has {opts} options, expected 7")
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(250)

            # no section may exceed one screen, or snapping breaks
            over = pg.evaluate(
                """() => Array.from(document.querySelectorAll('main > section'))
                    .map(s => ({id: s.id || s.className.split(' ')[0],
                                over: Math.round(s.scrollHeight - innerHeight)}))
                    .filter(x => x.over > 8)"""
            )
            if over:
                note(f"{name}: sections taller than one screen: {over}")

            # card contents must stay inside their card
            spill = pg.evaluate(
                """() => {
                    const out = [];
                    document.querySelectorAll('.product-card, .work-card').forEach(card => {
                        const c = card.getBoundingClientRect();
                        card.querySelectorAll('h3, .work-body, img').forEach(el => {
                            const r = el.getBoundingClientRect();
                            if (r.bottom > c.bottom + 2 || r.top < c.top - 2)
                                out.push(card.className.split(' ')[0] + ' > ' + el.tagName);
                        });
                    });
                    return out;
                }"""
            )
            if spill:
                note(f"{name}: content overflowing its card: {spill[:3]}")

            # A snap section must never carry a [data-reveal] transform: it
            # shifts the box the snap position is measured from, so the wheel
            # lands a few pixels off every section top.
            transformed = pg.eval_on_selector_all(
                "main > section[data-reveal]",
                "els => els.map(e => e.id || e.className.split(' ')[0])",
            )
            if transformed:
                note(f"{name}: snap sections carry data-reveal: {transformed}")

            # one wheel gesture advances exactly one section
            instant_top(pg)
            tops = pg.evaluate(
                "Array.from(document.querySelectorAll('main > section'))"
                ".map(s => Math.round(s.getBoundingClientRect().top + scrollY))"
            )
            if len(tops) > 1:
                pg.mouse.move(720, 500)
                before = pg.evaluate("scrollY")
                pg.mouse.wheel(0, 200)
                pg.wait_for_timeout(1100)
                after = pg.evaluate("scrollY")
                nearest = min(tops, key=lambda t: abs(t - after))
                if abs(nearest - after) > 6:
                    note(f"{name}: wheel landed at {after}, not a section top")
                if after <= before:
                    note(f"{name}: wheel did not advance")
                if len([t for t in tops if before < t < after]) > 1:
                    note(f"{name}: wheel skipped more than one section")

            real_errors = [e for e in errors if "content/" not in e and "Failed to load" not in e]
            if real_errors:
                note(f"{name}: console errors: {real_errors[:3]}")
            real_bad = [r for r in bad if "content/" not in r and "google" not in r]
            if real_bad:
                note(f"{name}: failed requests: {sorted(set(real_bad))[:3]}")

            pg.screenshot(path=f"_page-{name.replace('.html', '')}.png", full_page=True)
            pg.close()

        # ------------------------------------------------------- home page
        pg = b.new_page(viewport={"width": 1440, "height": 950})
        pg.goto(f"{BASE}/index.html", wait_until="networkidle")
        pg.wait_for_timeout(900)

        if "Concrete you can build" in pg.inner_text("h1"):
            note("index: hero still English fallback, cms.js did not apply")

        cards = pg.locator(".product-card").count()
        if cards != 6:
            note(f"index: product grid has {cards} cards, expected 6")

        # the grid links across to the detail bands on the products page
        for i in range(cards):
            href = pg.locator(".product-card").nth(i).get_attribute("href")
            if not href.startswith("products.html#product-"):
                note(f"index: product card links to {href}")

        # the quotation form is on the page as a section, not only in the modal
        if pg.locator("#quote [data-quote-form]").count() != 1:
            note("index: quotation section form missing")

        # the inline form's unit syncs independently of the modal's
        pg.locator("#quote").scroll_into_view_if_needed()
        pg.wait_for_timeout(500)
        pg.select_option("#quote [data-quote-product-select]", "readymix")
        pg.wait_for_timeout(250)
        unit = pg.inner_text("#quote [data-quote-unit]")
        if unit != "m³":
            note(f"index: inline form unit is {unit!r}, expected 'm³'")

        # the sticky button stays clear of the hero's own Get Quote
        instant_top(pg)
        if "is-shown" in (pg.get_attribute(".sticky-quote", "class") or ""):
            note("index: sticky quote visible over the hero")

        # language round trip keeps CMS content
        pg.click('.lang-btn[data-lang="en"]')
        pg.wait_for_timeout(500)
        if "Concrete you can build" not in pg.inner_text("h1"):
            note("index: English headline missing after switching to en")
        pg.click('.lang-btn[data-lang="th"]')
        pg.wait_for_timeout(500)
        if pg.inner_text('.site-nav a[data-cms="nav.about"]') != "เกี่ยวกับเรา":
            note("index: Thai nav lost after language round trip")

        pg.locator("#quote").scroll_into_view_if_needed()
        pg.wait_for_timeout(400)
        pg.screenshot(path="_quote-section.png")
        pg.close()

        # ---------------------------------------------------- products page
        pg = b.new_page(viewport={"width": 1440, "height": 950})
        pg.goto(f"{BASE}/products.html#product-pipe", wait_until="networkidle")
        pg.wait_for_timeout(1200)
        if pg.locator("[data-product-detail]").count() != 6:
            note("products: expected 6 detail bands")
        # deep link from the home grid must land on the right band
        band = pg.evaluate(
            "Math.round(document.querySelector('#product-pipe').getBoundingClientRect().top)")
        if abs(band) > 60:
            note(f"products: #product-pipe deep link landed {band}px off")
        pg.close()

        # ---------------------------------------------------- projects page
        pg = b.new_page(viewport={"width": 1440, "height": 950})
        pg.goto(f"{BASE}/projects.html", wait_until="networkidle")
        pg.wait_for_timeout(1200)

        works = pg.locator(".work-card").count()
        if works != 6:
            note(f"projects: works grid has {works} cards, expected 6")

        pg.click('[data-filter="road"]')
        pg.wait_for_timeout(300)
        if pg.locator(".work-card:not(.is-hidden)").count() != 2:
            note("projects: road filter did not narrow to 2 cards")
        pg.click('[data-filter="all"]')
        pg.wait_for_timeout(250)

        # all three pitch panels point at the one shared gallery
        links = pg.eval_on_selector_all(".pitch-link", "els => els.map(e => e.getAttribute('href'))")
        if links != ["#works", "#works", "#works"]:
            note(f"projects: pitch links are {links}, expected three #works")

        # clicking a card opens that project in the detail carousel
        frames = pg.locator(".project-frame").count()
        if frames != 6:
            note(f"projects: carousel has {frames} frames, expected 6")
        pg.locator('.work-card[data-project-index="2"]').click()
        pg.wait_for_timeout(900)
        active = pg.locator(".project-frame.is-active").get_attribute("data-title")
        shown = pg.inner_text("[data-project-name]")
        if active != shown:
            note(f"projects: carousel shows {active!r} but heading says {shown!r}")
        pg.click("[data-project-next]")
        pg.wait_for_timeout(400)
        if pg.locator(".project-frame.is-active").get_attribute("data-title") == active:
            note("projects: carousel next arrow did not advance")
        pg.close()

        # ------------------------------------ resilience: content unreachable
        pg = b.new_page()
        pg.route("**/content/*.json", lambda route: route.abort())
        pg.goto(f"{BASE}/index.html", wait_until="load")
        pg.wait_for_timeout(800)
        if pg.locator(".product-card").count() != 6:
            note("index broke when content/*.json was unreachable")
        if "Concrete you can build" not in pg.inner_text("h1"):
            note("index lost its inline English fallback when JSON was unreachable")
        pg.close()

        b.close()
finally:
    srv.terminate()

print()
if problems:
    for item in problems:
        print("FAIL ", item)
    print(f"\n{len(problems)} problems")
    sys.exit(1)
print(f"all browser checks passed across {len(PAGES)} pages")
