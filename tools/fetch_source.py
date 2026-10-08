"""Save a web page as markdown into corpus/sources/ (needs network access to the host).

Run: python tools/fetch_source.py <wikipedia-title> [slug]
Fetches the plain-text extract from the Wikipedia API and records the URL + date.
"""
import json, sys, datetime, urllib.parse, urllib.request, pathlib

title = sys.argv[1]
slug = sys.argv[2] if len(sys.argv) > 2 else title.lower().replace(" ", "-")
url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(
    {"action": "query", "prop": "extracts", "explaintext": 1, "format": "json", "titles": title})
data = json.load(urllib.request.urlopen(url))
text = next(iter(data["query"]["pages"].values()))["extract"]
text = text.replace("\n== ", "\n## ").replace(" ==\n", "\n")
out = pathlib.Path(__file__).resolve().parent.parent / "corpus" / "sources" / f"{slug}.md"
out.write_text(f"---\nsource: https://en.wikipedia.org/wiki/{title.replace(' ', '_')}\n"
               f"fetched: {datetime.date.today()}\n---\n# {title}\n\n{text}\n")
print("wrote", out)
