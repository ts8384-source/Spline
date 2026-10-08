# Spline

A learning repo for splines: Claude presents facts, you add your understanding and project notes.

```
pip install -r requirements.txt
marimo edit notebooks/01_bezier_de_casteljau.py     # interactive notebook
python tools/ingest.py && python tools/search.py "knot vector"   # local retrieval
```

See `CLAUDE.md` for conventions and `corpus/README.md` for the retrieval layer.

## Pages
`site/index.html` links to **Spline Lab** (`site/learn.html`, learning) and the **bouncing-ball project** (`site/project.html`). Rebuild with `python tools/build_site.py`. See `ROADMAP.md` for what to learn next.
