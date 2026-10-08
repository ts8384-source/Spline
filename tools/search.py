"""Search the local corpus. Prints short snippets so lookups stay cheap on context.

Run: python tools/search.py "knot vector" [-n 5]
"""
import sqlite3, sys, pathlib

DB = pathlib.Path(__file__).resolve().parent.parent / "corpus" / "index.db"


def search(query, n=5):
    con = sqlite3.connect(DB)
    q = " ".join(f'"{w}"' for w in query.split())
    return con.execute(
        "select path, heading, snippet(docs, 2, '[', ']', ' ... ', 40) "
        "from docs where docs match ? order by rank limit ?", (q, n)).fetchall()


if __name__ == "__main__":
    args = sys.argv[1:]
    n = int(args[args.index("-n") + 1]) if "-n" in args else 5
    if "-n" in args:
        del args[args.index("-n"):args.index("-n") + 2]
    for path, heading, snip in search(" ".join(args), n):
        print(f"{path} :: {heading}\n  {snip}\n")
