"""Inline site/src/* plus d3 and KaTeX (from site/node_modules) into one self-contained site/demo.html.

Setup once: (cd site && npm install).  Run: python tools/build_site.py
"""
import base64, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent / "site"
NM = ROOT / "node_modules"
read = lambda p: p.read_text()


def katex_css():
    css = read(NM / "katex/dist/katex.min.css")
    css = re.sub(r',url\(fonts/[^)]*\.woff\) format\("woff"\),url\(fonts/[^)]*\.ttf\) format\("truetype"\)', "", css)

    def inline(m):
        data = (NM / "katex/dist/fonts" / m.group(1)).read_bytes()
        return f"url(data:font/woff2;base64,{base64.b64encode(data).decode()})"

    return re.sub(r"url\(fonts/([^)]*\.woff2)\)", inline, css)


def script(text):
    return text.replace("</script", "<\\/script")


page = read(ROOT / "src/template.html")
for key, val in {
    "{{KATEX_CSS}}": katex_css(),
    "{{CSS}}": read(ROOT / "src/demo.css"),
    "{{D3}}": script(read(NM / "d3/dist/d3.min.js")),
    "{{KATEX_JS}}": script(read(NM / "katex/dist/katex.min.js")),
    "{{JS}}": script(read(ROOT / "src/demo.js")),
}.items():
    page = page.replace(key, val)
(ROOT / "demo.html").write_text(page)
print("wrote site/demo.html", len(page) // 1024, "KB")
