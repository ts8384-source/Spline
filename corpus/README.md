# Corpus (retrieval layer)

- `sources/` — reference text saved from outside (Wikipedia, lecture notes, textbook excerpts). Each file starts with `source:` and `fetched:` front matter. Never edit these by hand.
- `notes/` — Claude-written fact sheets (`status: unverified` until checked against a source) and your own notes.
- `index.db` — generated; rebuild with `python tools/ingest.py`.

Lookup: `python tools/search.py "knot vector" -n 5`
