#!/usr/bin/env python3
"""Validate a GitHub README: structure, links, images, accessibility, and GitHub compatibility.

Standard library only. External URLs are not fetched unless --check-urls is passed.

Usage:
    python validate_readme.py README.md
    python validate_readme.py README.md --json
    python validate_readme.py README.md --strict          # warnings also fail
    python validate_readme.py README.md --root .          # repo root for "/" paths
    python validate_readme.py README.md --check-urls      # HEAD-request external links
    python validate_readme.py README.md --assume-exists LICENSE --assume-exists docs

Exit code: 0 when there are no errors (and no warnings with --strict), 1 otherwise, 2 on usage errors.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass, field
from pathlib import Path

BADGE_HOSTS = ("img.shields.io", "badgen.net", "badge.fury.io", "codecov.io", "/badge.svg", "/badges/", "badge")
UNSUPPORTED_TAGS = ("style", "script", "iframe", "form", "object", "embed", "link", "meta", "button", "select", "textarea")
HYPE_WORDS = (
    "revolutionary", "blazing", "blazingly", "seamless", "seamlessly", "cutting-edge", "next-generation",
    "next-gen", "supercharge", "effortless", "effortlessly", "game-changing", "game changer", "world-class",
    "best-in-class", "unleash", "magical",
)
EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F2FF\U0001F900-\U0001F9FF]")
MAX_BADGES = 5
MAX_CODE_LINE = 100


@dataclass
class Finding:
    level: str
    code: str
    line: int
    message: str


@dataclass
class Report:
    file: str
    errors: list[Finding] = field(default_factory=list)
    warnings: list[Finding] = field(default_factory=list)
    stats: dict = field(default_factory=dict)

    def add(self, level: str, code: str, line: int, message: str) -> None:
        (self.errors if level == "error" else self.warnings).append(Finding(level, code, line, message))


def github_slug(text: str) -> str:
    """Approximates GitHub's heading anchor: lowercase, drop punctuation, spaces to hyphens."""
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = text.replace("`", "").strip().lower()
    out = []
    for ch in text:
        if ch in (" ", "-"):
            out.append("-")
        elif ch == "_" or ch.isalnum() or unicodedata.category(ch).startswith("M"):
            out.append(ch)
    return "".join(out)


def strip_code(lines: list[str], report: Report) -> tuple[list[str], list[tuple[int, str, str]]]:
    """Blanks fenced code so later passes ignore it. Returns visible lines and (line, lang, text) of code lines."""
    visible: list[str] = []
    code: list[tuple[int, str, str]] = []
    fence: str | None = None
    lang = ""
    opened_at = 0
    for number, line in enumerate(lines, 1):
        match = re.match(r"^\s{0,3}(`{3,}|~{3,})(.*)$", line)
        if fence is None and match:
            fence, lang, opened_at = match.group(1), match.group(2).strip(), number
            report.stats["code_blocks"] = report.stats.get("code_blocks", 0) + 1
            visible.append("")
            continue
        if fence is not None:
            if re.match(rf"^\s{{0,3}}{re.escape(fence[0])}{{{len(fence)},}}\s*$", line):
                fence = None
            else:
                code.append((number, lang, line))
            visible.append("")
            continue
        visible.append(re.sub(r"`[^`]*`", lambda m: " " * len(m.group(0)), line))
    if fence is not None:
        report.add("error", "unclosed-fence", opened_at, "Code fence is never closed.")
    return visible, code


def attr(tag: str, name: str) -> str | None:
    """Reads one attribute. Values are consumed in order, so "style=" inside a URL is not an attribute."""
    body = re.sub(r"^<\s*[a-zA-Z][a-zA-Z0-9]*", "", tag).rstrip(">/")
    for match in re.finditer(r'([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|\'[^\']*\'|[^\s"\'>]+))?', body):
        if match.group(1).lower() == name.lower():
            value = match.group(2)
            return "" if value is None else value.strip("\"'")
    return None


def is_external(target: str) -> bool:
    return bool(re.match(r"^[a-z][a-z0-9+.-]*:", target, re.I)) or target.startswith("//")


def is_badge(src: str) -> bool:
    return any(host in src for host in BADGE_HOSTS)


ASSUMED: set[str] = set()


def check_local(target: str, base: Path, root: Path, line: int, report: Report, kind: str, anchors: set[str]) -> None:
    if not target or is_external(target):
        return
    if target.startswith("#"):
        anchor = urllib.parse.unquote(target[1:]).lower()
        if anchor and anchor not in anchors:
            report.add("error", "broken-anchor", line, f"No heading or anchor for {target}.")
        return
    path_part = urllib.parse.unquote(target.split("#", 1)[0].split("?", 1)[0])
    if not path_part or path_part.lstrip("./").rstrip("/") in ASSUMED:
        return
    resolved = (root / path_part.lstrip("/")) if path_part.startswith("/") else (base / path_part)
    if not resolved.exists():
        report.add("error", f"missing-{kind}", line, f"{kind.capitalize()} target does not exist: {target}")


def validate(readme: Path, root: Path | None = None, check_urls: bool = False, assume: list[str] | None = None) -> Report:
    ASSUMED.clear()
    ASSUMED.update(item.lstrip("./").rstrip("/") for item in assume or [])
    report = Report(file=str(readme))
    text = readme.read_text(encoding="utf-8")
    lines = text.splitlines()
    base = readme.parent
    root = root or base
    visible, code = strip_code(lines, report)

    headings: list[tuple[int, int, str]] = []
    anchors: set[str] = set()
    counts: dict[str, int] = {}
    for number, line in enumerate(visible, 1):
        match = re.match(r"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$", line)
        if match:
            headings.append((number, len(match.group(1)), match.group(2)))
        for html in re.finditer(r"<h([1-6])[^>]*>(.*?)</h\1>", line, re.I):
            headings.append((number, int(html.group(1)), html.group(2)))
        for named in re.finditer(r"<a\s[^>]*\b(?:name|id)\s*=\s*[\"']([^\"']+)[\"']", line, re.I):
            anchors.add(named.group(1).lower())
    for _, _, title in headings:
        slug = github_slug(title)
        anchors.add(slug if slug not in counts else f"{slug}-{counts[slug]}")
        counts[slug] = counts.get(slug, 0) + 1

    h1 = [h for h in headings if h[1] == 1]
    if len(h1) > 1:
        report.add("error", "multiple-h1", h1[1][0], f"{len(h1)} top-level headings; use one H1 at most.")
    previous = 0
    for number, level, title in headings:
        if previous and level > previous + 1:
            report.add("warning", "heading-jump", number, f"Heading jumps from H{previous} to H{level}: {title}")
        previous = level
        if EMOJI.search(title):
            report.add("warning", "emoji-heading", number, f"Emoji in heading (ends up in the anchor and is read aloud): {title}")

    badges = 0
    images = 0
    joined = "\n".join(visible)

    target_pattern = r"\(\s*<?([^)\s>]*)>?(?:\s+\"[^\"]*\")?\s*\)"
    for match in re.finditer(r"!\[([^\]]*)\]" + target_pattern, joined):
        number = joined.count("\n", 0, match.start()) + 1
        alt, target = match.group(1), match.group(2)
        images += 1
        badges += is_badge(target)
        if not alt.strip():
            report.add("error", "image-alt", number, f"Image has no alt text: {target}")
        check_local(target, base, root, number, report, "image", anchors)
    # Links, including badge links whose label is an image: [![alt](src)](href)
    for match in re.finditer(r"(?<!!)\[((?:[^\[\]]|!?\[[^\]]*\]\([^)]*\))*)\]" + target_pattern, joined):
        number = joined.count("\n", 0, match.start()) + 1
        check_local(match.group(2), base, root, number, report, "link", anchors)
    for match in re.finditer(r"^\s{0,3}\[([^\]]+)\]:\s*(\S+)", joined, re.M):
        number = joined.count("\n", 0, match.start()) + 1
        check_local(match.group(2), base, root, number, report, "link", anchors)

    for match in re.finditer(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>", joined):
        number = joined.count("\n", 0, match.start()) + 1
        closing, name, tag = match.group(1), match.group(2).lower(), match.group(0)
        if closing:
            continue
        if name in UNSUPPORTED_TAGS:
            report.add("error", "unsupported-html", number, f"<{name}> is removed by GitHub's sanitizer.")
        if name == "input" and attr(tag, "type") != "checkbox":
            report.add("error", "unsupported-html", number, "<input> is removed by GitHub's sanitizer.")
        if attr(tag, "style") is not None:
            report.add("error", "style-attribute", number, f"style= on <{name}> is stripped by GitHub; the layout will not apply.")
        if attr(tag, "class") is not None:
            report.add("warning", "class-attribute", number, f"class= on <{name}> has no effect on GitHub.")
        if name == "img":
            images += 1
            src = attr(tag, "src") or ""
            badges += is_badge(src)
            if attr(tag, "alt") is None:
                report.add("error", "image-alt", number, f"<img> without alt: {src}")
            if attr(tag, "width") is None and attr(tag, "height") is None and not is_badge(src):
                report.add("warning", "image-size", number, f"<img> without width; GitHub will show it at natural size: {src}")
            check_local(src, base, root, number, report, "image", anchors)
        if name == "source":
            for candidate in (attr(tag, "srcset") or "").split(","):
                check_local(candidate.strip().split(" ")[0], base, root, number, report, "image", anchors)
        if name == "a":
            check_local(attr(tag, "href") or "", base, root, number, report, "link", anchors)

    for match in re.finditer(r"<picture\b[^>]*>(.*?)</picture>", joined, re.I | re.S):
        if not re.search(r"<img\b", match.group(1), re.I):
            number = joined.count("\n", 0, match.start()) + 1
            report.add("error", "picture-fallback", number, "<picture> has no <img> fallback; nothing renders on GitHub.")

    for match in re.finditer(r"<div\s+align=[\"']?center[\"']?[^>]*>(.*?)</div>", joined, re.I | re.S):
        if re.search(r"^\s{0,3}##\s", match.group(1), re.M):
            number = joined.count("\n", 0, match.start()) + 1
            report.add("warning", "centered-body", number, "Centered block contains section headings; return to left alignment after the identity block.")

    if badges > MAX_BADGES:
        report.add("warning", "badge-count", 1, f"{badges} badges; more than {MAX_BADGES} competes with the project itself.")

    lowered = joined.lower()
    for word in HYPE_WORDS:
        for hit in re.finditer(rf"\b{re.escape(word)}\b", lowered):
            number = lowered.count("\n", 0, hit.start()) + 1
            report.add("warning", "hype-word", number, f'Unmeasured marketing word: "{word}".')

    for number, lang, line in code:
        if len(line) > MAX_CODE_LINE:
            report.add("warning", "long-code-line", number, f"Code line is {len(line)} characters; it will scroll on mobile.")

    if not re.search(r"licen[cs]e", lowered):
        report.add("warning", "no-license", 1, "README never mentions the license.")

    if check_urls:
        for url in sorted(set(re.findall(r"https?://[^\s)\"'<>]+", joined))):
            status = head(url)
            if status is None or status >= 400:
                report.add("warning", "url-status", 1, f"{url} returned {status or 'no response'}.")

    report.stats = {
        "lines": len(lines),
        "headings": len(headings),
        "images": images,
        "badges": badges,
        "code_blocks": report.stats.get("code_blocks", 0),
    }
    return report


def head(url: str) -> int | None:
    request = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "marquee-validator"})
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            return response.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None


def print_report(report: Report) -> None:
    print(f"README check: {report.file}")
    print("  " + ", ".join(f"{key}={value}" for key, value in report.stats.items()))
    for finding in [*report.errors, *report.warnings]:
        print(f"  {finding.level.upper():7} L{finding.line:<5} {finding.code:18} {finding.message}")
    print(f"  {len(report.errors)} error(s), {len(report.warnings)} warning(s)")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("readme", type=Path)
    parser.add_argument("--root", type=Path, help="Repository root used for paths that start with /")
    parser.add_argument("--json", action="store_true", help="Print the report as JSON")
    parser.add_argument("--strict", action="store_true", help="Fail on warnings as well as errors")
    parser.add_argument("--check-urls", action="store_true", help="HEAD-request external URLs (needs network)")
    parser.add_argument("--assume-exists", action="append", default=[], metavar="PATH",
                        help="Treat this README-relative path as existing (repeatable), e.g. a file you are about to add")
    args = parser.parse_args(argv)
    if not args.readme.is_file():
        print(f"Not a file: {args.readme}", file=sys.stderr)
        return 2
    report = validate(args.readme, args.root, args.check_urls, args.assume_exists)
    if args.json:
        print(json.dumps(asdict(report), indent=2))
    else:
        print_report(report)
    failed = bool(report.errors) or (args.strict and bool(report.warnings))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
