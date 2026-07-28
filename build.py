#!/usr/bin/env python3
"""Bundle the whole guide into one self-contained HTML file.

    python3 build.py            # writes dist/the-bench.html

The result opens straight from disk with no server and no network — put it on
a tablet and read it on a train. The multi-file version in this folder stays
the source of truth; this is only a distribution format.

How it works: every module in src/ is wrapped in an IIFE that returns its
exports into a registry, `import` lines become destructuring from that
registry, and the chapters in content/ are inlined as a lookup the router
checks before it tries to fetch anything.

That is only safe because every module here uses the same two forms — named
imports and `export function|const|class` — and this script checks that it
still does before bundling.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
ENTRY = "src/app.js"

TRAIL = r'[ \t]*(?://[^\n]*)?$'          # allow a trailing line comment
IMPORT_NAMED = re.compile(r'^import\s*\{([^}]*)\}\s*from\s*["\']([^"\']+)["\'];?' + TRAIL, re.M)
IMPORT_BARE = re.compile(r'^import\s*["\']([^"\']+)["\'];?' + TRAIL, re.M)
LEFTOVER = re.compile(r'^\s*(import|export)\s', re.M)
EXPORT_DECL = re.compile(r'^export\s+(function|const|let|class)\s+([A-Za-z_$][\w$]*)', re.M)
UNSUPPORTED = re.compile(r'^export\s+default|^export\s*\{|^import\s+\*|^import\s+[A-Za-z_$]', re.M)


def resolve(base: str, spec: str) -> str:
    """Resolve a relative specifier against the importing module's path.

    Anchored to ROOT rather than the process's working directory, so this
    works when run from anywhere: `python3 /path/to/build.py`.
    """
    return str((ROOT / base).parent.joinpath(spec).resolve().relative_to(ROOT)).replace("\\", "/")


def collect(entry: str):
    """Depth-first walk of the import graph, returning modules in load order."""
    order, seen, stack = [], set(), set()

    def visit(path: str):
        if path in order:
            return
        if path in stack:
            sys.exit(f"circular import involving {path} — the bundler cannot order these")
        stack.add(path)

        src = (ROOT / path).read_text()
        bad = UNSUPPORTED.search(src)
        if bad:
            sys.exit(
                f"{path}: {bad.group(0).strip()!r} is not supported by this bundler.\n"
                "Use named imports and `export function|const|let|class` only, or "
                "teach build.py the new form."
            )

        for _, spec in IMPORT_NAMED.findall(src):
            visit(resolve(path, spec))
        for spec in IMPORT_BARE.findall(src):
            visit(resolve(path, spec))

        stack.discard(path)
        seen.add(path)
        order.append(path)

    visit(entry)
    return order


def wrap(path: str) -> str:
    src = (ROOT / path).read_text()
    exports = [name for _, name in EXPORT_DECL.findall(src)]

    def named(m):
        names = []
        for piece in m.group(1).split(","):
            piece = piece.strip()
            if not piece:
                continue
            if " as " in piece:
                a, b = (s.strip() for s in piece.split(" as "))
                names.append(f"{a}: {b}")
            else:
                names.append(piece)
        return f'const {{ {", ".join(names)} }} = __M[{resolve(path, m.group(2))!r}];'

    body = IMPORT_NAMED.sub(named, src)
    body = IMPORT_BARE.sub("", body)                       # already in the registry
    body = EXPORT_DECL.sub(r"\1 \2", body)

    returns = "{ " + ", ".join(exports) + " }" if exports else "{}"
    indented = "\n".join(("  " + line) if line.strip() else line for line in body.splitlines())
    return f'/* ---- {path} ---- */\n__M[{path!r}] = (function () {{\n{indented}\n  return {returns};\n}})();\n'


def js_string(text: str) -> str:
    """A JS string literal safe to sit inside a <script> element."""
    out = (text.replace("\\", "\\\\").replace('"', '\\"')
               .replace("\n", "\\n").replace("\r", "")
               .replace("</script", "<\\/script").replace("<!--", "<\\!--"))
    return f'"{out}"'


def main():
    html = (ROOT / "index.html").read_text()

    # inline the stylesheets, in the order the document lists them
    def inline_css(m):
        css = (ROOT / m.group(1)).read_text()
        return f"<style>\n/* ---- {m.group(1)} ---- */\n{css}\n</style>"

    html = re.sub(r'<link rel="stylesheet" href="(styles/[^"]+)">', inline_css, html)

    modules = collect(ENTRY)
    bundle = "\n".join(wrap(p) for p in modules)

    chapters = sorted((ROOT / "content").rglob("*.html"))
    content_map = ",\n".join(
        f'  "{p.relative_to(ROOT).as_posix()}": {js_string(p.read_text())}'
        for p in chapters
    )

    stray = LEFTOVER.search(bundle)
    if stray:
        line = bundle[:stray.start()].count("\n") + 1
        context = bundle.splitlines()[line - 1].strip()
        sys.exit(
            f"an import/export survived bundling at bundle line {line}:\n    {context}\n"
            "The bundle would fail at runtime with 'Cannot use import statement "
            "outside a module'. Teach build.py this form."
        )

    script = (
        "<script>\nwindow.__FE_CONTENT = {\n" + content_map + "\n};\n</script>\n"
        "<script>\n"
        "/* Bundled by build.py. Each module is an IIFE returning its exports\n"
        "   into __M; imports are destructured back out of it. */\n"
        "const __M = {};\n" + bundle + "</script>"
    )
    # a lambda, not a plain string: the bundle is full of backslashes and
    # re.sub would try to interpret them as group references
    html = re.sub(r'<script type="module" src="src/app\.js"></script>', lambda _m: script, html)

    # the hosted font is an enhancement; a file opened from disk offline should
    # not sit waiting on it
    html = html.replace(
        '<link rel="stylesheet" href="https://fonts.googleapis.com',
        '<link rel="stylesheet" media="print" onload="this.media=\'all\'" href="https://fonts.googleapis.com',
    )

    out = ROOT / "dist" / "the-bench.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html)

    kb = len(html.encode()) / 1024
    print(f"{out.relative_to(ROOT)}  —  {kb:.0f} KB, {len(modules)} modules, {len(chapters)} chapters")
    print("Open it directly in a browser. No server, no network.")


if __name__ == "__main__":
    main()
