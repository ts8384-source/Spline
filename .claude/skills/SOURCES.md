# Vendored skills — provenance and vetting

Copied unmodified on 2026-10-08. Each file was read or pattern-scanned for shell commands, network calls, credentials, obfuscation and prompt-injection phrasing. All files are Markdown; none contain scripts.

| Skill | Source | License | Notes |
|---|---|---|---|
| `3b1b-style-animation/` | https://github.com/subinium/3b1b-style-animation-skill (main, skills/3b1b-style-animation) | MIT | SKILL.md (5 KB, always loaded on match) + 17 rule files loaded on demand. Only install command: `pip install manim`. Unofficial fan project, not affiliated with 3Blue1Brown. |
| `d3-viz/` | https://github.com/chrisvoncsefalvay/claude-d3js-skill (main, SKILL.md) | not checked | 22 KB. Only external reference is the official d3 CDN `https://d3js.org/d3.v7.min.js`. |

Evaluated and not installed: vumichien/manim-skill — a plugin with a four-agent pipeline and install scripts that download tools (uv); too heavy for the minimal-context goal.
