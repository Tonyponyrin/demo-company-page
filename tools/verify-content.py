"""Checks from CLAUDE.md -> "Verifying changes". Run from the repository root."""
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    yaml = None

LOCALES = ["th", "en", "zh"]
fails = []
warns = []


def fail(msg):
    fails.append(msg)


def warn(msg):
    warns.append(msg)


html = open("index.html", encoding="utf-8").read()
site = json.load(open("content/site.json", encoding="utf-8"))
products = json.load(open("content/products.json", encoding="utf-8"))["products"]
projects = json.load(open("content/projects.json", encoding="utf-8"))["projects"]


def resolve(scope, path):
    cur = scope
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def leaves(node, prefix=""):
    if isinstance(node, dict):
        for k, v in node.items():
            yield from leaves(v, prefix + k + ".")
    else:
        yield prefix.rstrip("."), node


# ---- 1. every data-cms* path resolves in all three locales -----------------
paths = set()
for attr in ["data-cms", "data-cms-src", "data-cms-alt", "data-cms-content"]:
    paths |= set(re.findall(attr + r'="([^"]+)"', html))

for path in sorted(paths):
    for loc in LOCALES:
        if resolve(site[loc], path) is None:
            fail(f"[html->json] {loc}.{path} missing in site.json")
print(f"1. data-cms paths checked: {len(paths)}")


# ---- 2. locales have identical key shape ----------------------------------
def shape(node, prefix=""):
    out = set()
    if isinstance(node, dict):
        for k, v in node.items():
            out.add(prefix + k)
            out |= shape(v, prefix + k + ".")
    return out


base = shape(site["th"])
for loc in LOCALES[1:]:
    other = shape(site[loc])
    for k in sorted(base - other):
        fail(f"[shape] '{k}' present in th, missing in {loc}")
    for k in sorted(other - base):
        fail(f"[shape] '{k}' present in {loc}, missing in th")
print(f"2. locale key shape: {len(base)} keys per locale")


# ---- 3. no untranslated th/zh values --------------------------------------
# Fields declared i18n: duplicate are meant to be identical across locales.
DUPLICATE = re.compile(
    r"([Ii]mage$|^contact\.phone|^contact\.line(Id|Url)$|^contact\.fbUrl$"
    r"|^contact\.mapEmbed$|^about\.experienceValue$|^quoteForm\.)"
)

en_leaves = dict(leaves(site["en"]))
for loc in ("th", "zh"):
    for key, value in dict(leaves(site[loc])).items():
        if DUPLICATE.search(key):
            continue
        if key in en_leaves and value == en_leaves[key]:
            warn(f"[untranslated] {loc}.{key} is identical to en")
print(f"3. translation check: {len(en_leaves)} leaf values per locale")


# ---- 4. config.yml declares exactly what site.json holds ------------------
if yaml is None:
    warn("[config] PyYAML not installed — skipped config.yml cross-check")
else:
    cfg = yaml.safe_load(open("admin/config.yml", encoding="utf-8"))
    site_coll = next(c for c in cfg["collections"] if c["name"] == "site")
    fields = site_coll["files"][0]["fields"]

    def declared(fs, prefix=""):
        out = set()
        for f in fs:
            name = prefix + f["name"]
            if f.get("widget") == "object":
                out |= declared(f["fields"], name + ".")
            else:
                out.add(name)
        return out

    dec = declared(fields)
    present = {k for k, v in leaves(site["th"])}

    for k in sorted(dec - present):
        fail(f"[config] declared in config.yml but missing from site.json: {k}")
    for k in sorted(present - dec):
        fail(f"[config] in site.json but not declared in config.yml: {k}")
    print(f"4. config.yml fields cross-checked: {len(dec)}")


# ---- 5. product anchors exist in the markup -------------------------------
anchors = set(re.findall(r'data-product-detail="([^"]+)"', html))
for p in products:
    if p["anchor"] not in anchors:
        fail(f"[anchor] product '{p['anchor']}' has no #product-{p['anchor']} band")
    if not p.get("unit"):
        fail(f"[unit] product '{p['anchor']}' has no unit for the quote form")
for href in set(re.findall(r'href="#product-([a-z]+)"', html)):
    if href not in anchors:
        fail(f"[anchor] a card links to #product-{href}, which has no detail band")
print(f"5. product anchors: {len(anchors)} bands, {len(products)} products")


# ---- 6. list entries have all three languages -----------------------------
def check_list(name, rows, fields):
    for row in rows:
        for f in fields:
            for loc in LOCALES:
                key = f"{f}_{loc}"
                if not row.get(key):
                    fail(f"[{name}] entry '{row.get('anchor') or row.get('order')}' missing {key}")


check_list("products", products, ["title", "tagline", "body", "spec", "alt"])
check_list("projects", projects, ["title", "label", "description", "alt"])
print(f"6. list entries: {len(products)} products, {len(projects)} projects")


# ---- 7. the nav scrolls to sections that exist ----------------------------
# The nav is in-page anchors, so a renamed section id silently breaks a link.
nav = re.search(r'<nav class="site-nav".*?</nav>', html, re.S)
nav_targets = re.findall(r'href="#([a-z-]+)"', nav.group(0)) if nav else []
if len(nav_targets) != 4:
    fail(f"[nav] expected 4 menu links, found {len(nav_targets)}")
for target in nav_targets:
    if f'id="{target}"' not in html:
        fail(f"[nav] menu links to #{target}, which is not an element id")
print(f"7. nav anchors: {len(nav_targets)} links, all resolving")


# ---- 8. no snap section carries a reveal transform ------------------------
# [data-reveal] applies a translate, which shifts the box the scroll-snap
# position is measured from, so the wheel lands off every section top.
for tag in re.findall(r"<section[^>]*>", html):
    if "data-reveal" in tag:
        fail(f"[snap] a <section> carries data-reveal: {tag[:80]}")
print("8. no section carries data-reveal itself")


# ---- 9. referenced asset files exist --------------------------------------
refs = set(re.findall(r'(?:src|href)="(\./assets/[^"]+)"', html))
for node in (site, {"p": products}, {"j": projects}):
    refs |= set(re.findall(r'"(\./assets/[^"]+)"', json.dumps(node, ensure_ascii=False)))
for missing in sorted(r for r in refs if not os.path.exists(r)):
    fail(f"[asset] referenced but not on disk: {missing}")
print(f"9. asset references: {len(refs)} checked")


# ---- 10. SEO/GEO basics: favicon, canonical, and structured data ----------
for needle, label in [
    ('rel="canonical"', "canonical link"),
    ('rel="icon"', "favicon link"),
    ('property="og:title"', "Open Graph title"),
    ('name="twitter:card"', "Twitter card"),
    ('application/ld+json', "JSON-LD block"),
]:
    if needle not in html:
        fail(f"[seo] missing {label} in <head>")

# The raw HTML source (what a non-JS crawler sees) is the inline English
# fallback copy, so the static lang attribute must say "en", not "th" --
# script.js overrides it to the visitor's language on load, but only for
# clients that run JS at all.
if '<html lang="en">' not in html:
    fail('[seo] <html lang="..."> should be "en" to match the inline fallback '
         'copy that a non-JS crawler actually sees')

# JSON-LD is hand-authored, not CMS-driven (see CLAUDE.md), so it silently
# drifts if content/site.json's contact details change underneath it. Catch
# the facts we can compare mechanically.
import re as _re
ld_match = _re.search(r'<script type="application/ld\+json">(.*?)</script>', html, _re.S)
if ld_match:
    ld = json.loads(ld_match.group(1))
    org = next((n for n in ld.get("@graph", []) if n.get("@type") == "Organization"), None)
    en_contact = site["en"]["contact"]
    if org:
        want_phone = "+66" + en_contact["phone1"].replace("-", "").lstrip("0")
        if org.get("telephone") != want_phone:
            fail(f"[seo] JSON-LD phone {org.get('telephone')!r} does not match "
                 f"site.json contact.phone1 ({en_contact['phone1']!r})")
        want_line = en_contact.get("lineUrl")
        if want_line and want_line not in org.get("sameAs", []):
            fail("[seo] JSON-LD sameAs is missing the current LINE URL from site.json")
print("10. SEO/GEO basics present, JSON-LD facts match site.json")


# ---- report ---------------------------------------------------------------
print()
for w in warns:
    print("WARN ", w)
for f in fails:
    print("FAIL ", f)
print()
print(f"{len(fails)} failures, {len(warns)} warnings")
sys.exit(1 if fails else 0)
