"""Checks from CLAUDE.md -> "Verifying changes". Run from the repository root."""
import json
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


PAGES = ["index.html", "about.html", "products.html", "projects.html", "contact.html"]
pages = {name: open(name, encoding="utf-8").read() for name in PAGES}
html = "\n".join(pages.values())          # every check below spans all pages
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


# ---- 1. every data-cms* path resolves in all three locales -----------------
attrs = ["data-cms", "data-cms-src", "data-cms-alt", "data-cms-content"]
paths = set()
for attr in attrs:
    paths |= set(re.findall(attr + r'="([^"]+)"', html))

for path in sorted(paths):
    for loc in LOCALES:
        if resolve(site[loc], path) is None:
            fail(f"[html->json] {loc}.{path} missing in site.json")
print(f"1. data-cms paths checked: {len(paths)} across {len(PAGES)} pages")


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


def leaves(node, prefix=""):
    if isinstance(node, dict):
        for k, v in node.items():
            yield from leaves(v, prefix + k + "." if prefix or True else k)
    else:
        yield prefix.rstrip("."), node


en_leaves = dict(leaves(site["en"]))
for loc in ("th", "zh"):
    loc_leaves = dict(leaves(site[loc]))
    for key, value in loc_leaves.items():
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
# The grid is on index.html and links across to the detail bands on products.html.
anchors = set(re.findall(r'data-product-detail="([^"]+)"', pages["products.html"]))
for href in set(re.findall(r'href="products\.html#product-([a-z]+)"', pages["index.html"])):
    if href not in anchors:
        fail(f"[anchor] index.html links to #product-{href}, which products.html lacks")
for p in products:
    if p["anchor"] not in anchors:
        fail(f"[anchor] product '{p['anchor']}' has no #product-{p['anchor']} band")
    if not p.get("unit"):
        fail(f"[unit] product '{p['anchor']}' has no unit for the quote form")
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


# ---- 7. shared chrome is identical across the five pages ------------------
import subprocess

result = subprocess.run(
    [sys.executable, "tools/sync-chrome.py", "--check"],
    capture_output=True, text=True,
)
if result.returncode != 0:
    fail("[chrome] " + result.stdout.strip().replace("\n", " / "))
print("7. " + (result.stdout.strip() or "chrome check ran"))


# ---- 8. every page links to every other page ------------------------------
for name, text in pages.items():
    for target in PAGES:
        if target == "index.html":
            continue
        if f'href="{target}"' not in text:
            fail(f"[nav] {name} has no link to {target}")
print(f"8. cross-page nav links checked on {len(PAGES)} pages")


# ---- 9. referenced asset files exist --------------------------------------
import os

refs = set(re.findall(r'src="(\./assets/[^"]+)"', html))
for node in (site, {"p": products}, {"j": projects}):
    refs |= set(re.findall(r'"(\./assets/[^"]+)"', json.dumps(node, ensure_ascii=False)))
missing = [r for r in sorted(refs) if not os.path.exists(r)]
for m in missing:
    fail(f"[asset] referenced but not on disk: {m}")
print(f"9. asset references: {len(refs)} checked")


# ---- report ---------------------------------------------------------------
print()
for w in warns:
    print("WARN ", w)
for f in fails:
    print("FAIL ", f)
print()
print(f"{len(fails)} failures, {len(warns)} warnings")
sys.exit(1 if fails else 0)
