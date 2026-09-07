"""Copy the shared chrome regions from index.html into the other pages.

The site has five hand-written HTML pages and no build step, so the header,
footer, floating buttons, quote modal and contact block are physically
duplicated. index.html is the canonical copy. Run this after editing any of
them there:

    python tools/sync-chrome.py            # rewrite the other pages
    python tools/sync-chrome.py --check    # fail if they have drifted

tools/verify-content.py runs the check, so drift is caught rather than shipped.
"""
import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = "index.html"
TARGETS = ["about.html", "products.html", "projects.html", "contact.html"]

REGION = re.compile(
    r"(<!-- #region (chrome:[a-z]+) -->)(.*?)(<!-- #endregion \2 -->)",
    re.DOTALL,
)


def regions(text):
    return {m.group(2): m.group(3) for m in REGION.finditer(text)}


def apply_regions(text, source_regions):
    """Replace each region in `text` with the source copy. Regions the page
    does not declare are left alone — not every page carries every region."""
    missing = []

    def swap(m):
        name = m.group(2)
        if name not in source_regions:
            missing.append(name)
            return m.group(0)
        return m.group(1) + source_regions[name] + m.group(4)

    return REGION.sub(swap, text), missing


def main():
    check = "--check" in sys.argv
    src = (ROOT / SOURCE).read_text(encoding="utf-8")
    src_regions = regions(src)

    if not src_regions:
        print(f"no chrome regions found in {SOURCE}")
        return 1

    drifted = []
    for name in TARGETS:
        path = ROOT / name
        if not path.exists():
            print(f"missing page: {name}")
            return 1

        before = path.read_text(encoding="utf-8")
        after, missing = apply_regions(before, src_regions)

        for region in missing:
            print(f"{name}: declares {region}, which {SOURCE} does not define")
            return 1

        if before == after:
            continue

        drifted.append(name)
        if not check:
            path.write_text(after, encoding="utf-8")

    if check:
        if drifted:
            print("chrome has drifted from index.html in: " + ", ".join(drifted))
            print("run: python tools/sync-chrome.py")
            return 1
        print(f"chrome in sync across {len(TARGETS) + 1} pages "
              f"({len(src_regions)} regions)")
        return 0

    if drifted:
        print("updated: " + ", ".join(drifted))
    else:
        print("already in sync")
    return 0


if __name__ == "__main__":
    sys.exit(main())
