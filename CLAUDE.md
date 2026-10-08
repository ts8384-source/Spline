# Spline learning repo

Goal: learn splines. Claude presents facts; the user adds their own understanding and how they use it in their projects. Notebooks are the UI; do not hand-write HTML/CSS or add a JS framework.

## Context-frugal rules
- Look things up locally first: `python tools/search.py "<query>" -n 5`. Only go to the web when the corpus has no answer, then save the result with `tools/fetch_source.py` or into `corpus/sources/` with `source:` and `fetched:` front matter.
- Do not read whole corpus files; use the search snippets.
- Facts written from memory go in `corpus/notes/` with `status: unverified`.

## Notebooks (marimo)
- Live in `notebooks/`, plain `.py`. Run: `marimo edit notebooks/<name>.py`; static export: `marimo export html notebooks/<name>.py -o site/<name>.html`.
- Every notebook has three sections: **Facts** (Claude), **My understanding** (user), **In my projects** (user). Copy `notebooks/_template.py`.
- Math in markdown cells with `$...$` / `$$...$$`. Interactivity with `mo.ui.slider` etc. Diagrams with matplotlib or mermaid fenced blocks.
