"""Build corpus/index.db (SQLite FTS5) from every .md under corpus/.

Files are split on markdown headings so a search hit is one section, not a whole file.
Run: python tools/ingest.py
"""
import re, sqlite3, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / "corpus" / "index.db"


def sections(text):
    parts = re.split(r"(?m)^(?=#{1,3} )", text)
    for p in parts:
        p = p.strip()
        if p:
            yield p.splitlines()[0].lstrip("# ").strip(), p


def main():
    DB.unlink(missing_ok=True)
    con = sqlite3.connect(DB)
    con.execute("create virtual table docs using fts5(path, heading, body, tokenize='porter')")
    n = 0
    for f in sorted((ROOT / "corpus").rglob("*.md")):
        if f.name == "README.md":
            continue
        for heading, body in sections(f.read_text()):
            con.execute("insert into docs values (?,?,?)", (str(f.relative_to(ROOT)), heading, body))
            n += 1
    con.commit()
    print(f"indexed {n} sections")


if __name__ == "__main__":
    main()
