"""Build the static pages in site/ from site/src/. Each page is one self-contained HTML file.

Setup once: (cd site && npm install).  Run: python tools/build_site.py

Pages (edit PAGES to add or move sections):
  learn.html    Spline Lab: general spline demos (sections 1-6, 11, 12, 9, 10)
  project.html  Bouncing-ball project: how splines might be used as a network readout (sections 7-8)
  index.html    Landing page linking to both
Sources: site/src/sections/sN.html (markup), site/src/js/sN.js (behaviour), site/src/js/common.js (shared helpers),
site/src/demo.css, site/src/shell.html (page frame).
"""
import base64, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent / "site"
SRC, NM = ROOT / "src", ROOT / "node_modules"
read = lambda p: p.read_text()

PAGES = {
    "learn.html": dict(
        title="Spline Lab", h1="Spline Lab",
        lede="Ten interactive demos for learning splines, ordered the 3Blue1Brown way: a hook, then intuition, then the formula.",
        sections=[1, 2, 3, 4, 5, 6, 11, 12, 9, 10],
        footer="Palette and teaching order follow the vendored <code>3b1b-style-animation</code> skill; chart mechanics (scales, joins, drag, clip-paths) follow <code>d3-viz</code>."),
    "project.html": dict(
        title="Bouncing-ball project", h1="Project: spline readout for a bouncing ball",
        lede="How splines might be used as the output of a recurrent spiking network that predicts a bouncing ball. Kept separate from the learning demos; these pages assume the ideas in the Spline Lab.",
        sections=[7, 8],
        footer="Project notes live in <code>corpus/notes/my-project-context.md</code>."),
}


def katex_css():
    css = read(NM / "katex/dist/katex.min.css")
    css = re.sub(r',url\(fonts/[^)]*\.woff\) format\("woff"\),url\(fonts/[^)]*\.ttf\) format\("truetype"\)', "", css)

    def inline(m):
        data = (NM / "katex/dist/fonts" / m.group(1)).read_bytes()
        return f"url(data:font/woff2;base64,{base64.b64encode(data).decode()})"

    return re.sub(r"url\(fonts/([^)]*\.woff2)\)", inline, css)


def script(text):
    return text.replace("</script", "<\\/script")


shell, css = read(SRC / "shell.html"), read(SRC / "demo.css")
libs = {"{{KATEX_CSS}}": katex_css(), "{{D3}}": script(read(NM / "d3/dist/d3.min.js")), "{{KATEX_JS}}": script(read(NM / "katex/dist/katex.min.js"))}

for name, pg in PAGES.items():
    sections = "\n".join(read(SRC / f"sections/s{n}.html") for n in pg["sections"])
    js = read(SRC / "js/common.js") + "".join(read(SRC / f"js/s{n}.js") for n in pg["sections"])
    page = shell
    for key, val in {"{{TITLE}}": pg["title"], "{{H1}}": pg["h1"], "{{LEDE}}": pg["lede"], "{{FOOTER}}": pg["footer"],
                     "{{SECTIONS}}": sections, "{{CSS}}": css, **libs, "{{JS}}": script(js)}.items():
        page = page.replace(key, val)
    (ROOT / name).write_text(page)
    print("wrote", name, len(page) // 1024, "KB")

index = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spline</title><style>{css}</style></head><body><main>
<header><h1>Spline</h1><p class="lede">Two pages: learn the ideas, then see how they might apply to the project.</p></header>
<div class="cards">
<a href="learn.html"><h2>Spline Lab</h2><p>Why not one polynomial, sums of bumps, de Casteljau, the weight tree, what <i>t</i> is, and why we need it.</p></a>
<a href="project.html"><h2>Bouncing-ball project</h2><p>Knots on a bounce, and a spline as the output of a spiking network over a sliding window.</p></a>
</div></main></body></html>"""
(ROOT / "index.html").write_text(index)
print("wrote index.html")
