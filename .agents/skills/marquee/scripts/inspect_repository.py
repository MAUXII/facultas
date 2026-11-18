#!/usr/bin/env python3
"""Map a repository for README design: manifests, commands, license, CI, docs, assets, colors, and fonts.

Standard library only. Reads files; never runs project code and never prints secret values
(only variable names from .env.example-style files).

Usage:
    python inspect_repository.py <repo>                  # markdown summary
    python inspect_repository.py <repo> --format json    # machine-readable
    python inspect_repository.py <repo> --max-files 30000

The output is a map of files to open, not a verdict about the design.
"""
from __future__ import annotations

import argparse
import json
import re
import struct
import sys
from collections import Counter
from pathlib import Path

try:
    import tomllib
except ModuleNotFoundError:  # Python < 3.11
    tomllib = None

SKIP_DIRS = {
    ".git", "node_modules", ".next", ".nuxt", ".svelte-kit", "dist", "build", "out", "target", ".venv", "venv",
    "env", "__pycache__", "vendor", "coverage", ".turbo", ".cache", ".parcel-cache", ".pnpm-store", ".idea",
    ".vscode", ".tox", ".mypy_cache", ".pytest_cache", "Pods", ".gradle",
}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".avif"}
STYLE_EXT = {".css", ".scss", ".sass", ".less", ".pcss"}
TOKEN_HINTS = ("tailwind.config", "theme", "tokens", "colors", "palette", "design-system")
LOGO_HINTS = ("logo", "icon", "mark", "wordmark", "brand", "favicon", "emblem", "avatar")
SHOT_HINTS = ("screenshot", "screen", "preview", "demo", "hero", "banner", "og", "social", "cover", "showcase")
ENV_FILES = (".env.example", ".env.sample", ".env.template", "example.env")
FRAMEWORK_DEPS = (
    "next", "react", "vue", "nuxt", "svelte", "@sveltejs/kit", "astro", "solid-js", "angular", "@angular/core",
    "electron", "tauri", "@tauri-apps/api", "express", "fastify", "hono", "tailwindcss", "three", "react-native",
    "expo", "vite", "commander", "yargs", "ink", "oclif",
)
LICENSE_PATTERNS = (
    ("MIT", r"permission is hereby granted, free of charge"),
    ("Apache-2.0", r"apache license,?\s+version 2\.0"),
    ("GPL-3.0", r"gnu general public license\s+version 3"),
    ("AGPL-3.0", r"gnu affero general public license"),
    ("LGPL", r"gnu lesser general public license"),
    ("MPL-2.0", r"mozilla public license,?\s+v(ersion)?\.?\s*2\.0"),
    ("BSD", r"redistribution and use in source and binary forms"),
    ("ISC", r"permission to use, copy, modify, and/or distribute this software"),
    ("Unlicense", r"this is free and unencumbered software"),
)


def walk(root: Path, max_files: int) -> list[Path]:
    files: list[Path] = []
    stack = [root]
    while stack and len(files) < max_files:
        current = stack.pop()
        try:
            entries = sorted(current.iterdir())
        except OSError:
            continue
        for entry in entries:
            if entry.is_dir():
                if entry.name not in SKIP_DIRS:
                    stack.append(entry)
            elif entry.is_file():
                files.append(entry)
                if len(files) >= max_files:
                    break
    return files


def read(path: Path, limit: int = 400_000) -> str:
    try:
        return path.read_bytes()[:limit].decode("utf-8", errors="replace")
    except OSError:
        return ""


def rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def image_size(path: Path) -> tuple[int, int] | None:
    try:
        head = path.read_bytes()[:4096]
    except OSError:
        return None
    if head[:8] == b"\x89PNG\r\n\x1a\n" and len(head) >= 24:
        return struct.unpack(">II", head[16:24])
    if head[:6] in (b"GIF87a", b"GIF89a"):
        return struct.unpack("<HH", head[6:10])
    if path.suffix.lower() == ".svg":
        text = head.decode("utf-8", errors="replace")
        box = re.search(r'viewBox\s*=\s*"[\d.\-]+[\s,]+[\d.\-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"', text)
        if box:
            return int(float(box.group(1))), int(float(box.group(2)))
        width = re.search(r'\bwidth\s*=\s*"([\d.]+)', text)
        height = re.search(r'\bheight\s*=\s*"([\d.]+)', text)
        if width and height:
            return int(float(width.group(1))), int(float(height.group(1)))
    if head[:2] == b"\xff\xd8":
        data = path.read_bytes()
        index = 2
        while index < len(data) - 9:
            if data[index] != 0xFF:
                index += 1
                continue
            marker = data[index + 1]
            if marker in (0xC0, 0xC1, 0xC2):
                height, width = struct.unpack(">HH", data[index + 5:index + 9])
                return width, height
            index += 2 + struct.unpack(">H", data[index + 2:index + 4])[0]
    return None


def package_json(path: Path, root: Path) -> dict:
    try:
        data = json.loads(read(path))
    except json.JSONDecodeError as exc:
        return {"file": rel(path, root), "error": f"invalid JSON: {exc}"}
    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {}), **data.get("peerDependencies", {})}
    bin_field = data.get("bin")
    return {
        "file": rel(path, root),
        "name": data.get("name"),
        "version": data.get("version"),
        "description": data.get("description"),
        "private": data.get("private", False),
        "license": data.get("license"),
        "bin": list(bin_field) if isinstance(bin_field, dict) else ([data.get("name")] if bin_field else []),
        "scripts": sorted(data.get("scripts", {})),
        "engines": data.get("engines", {}),
        "workspaces": data.get("workspaces"),
        "frameworks": sorted(dep for dep in FRAMEWORK_DEPS if dep in deps),
        "homepage": data.get("homepage"),
        "repository": data.get("repository"),
    }


def toml_file(path: Path) -> dict:
    if tomllib is None:
        return {}
    try:
        return tomllib.loads(read(path))
    except (tomllib.TOMLDecodeError, ValueError):
        return {}


def pyproject(path: Path, root: Path) -> dict:
    data = toml_file(path)
    project = data.get("project", {})
    poetry = data.get("tool", {}).get("poetry", {})
    return {
        "file": rel(path, root),
        "name": project.get("name") or poetry.get("name"),
        "version": project.get("version") or poetry.get("version"),
        "description": project.get("description") or poetry.get("description"),
        "requires_python": project.get("requires-python"),
        "scripts": sorted({**project.get("scripts", {}), **poetry.get("scripts", {})}),
        "license": project.get("license") if isinstance(project.get("license"), str) else (project.get("license") or {}).get("text"),
    }


def cargo(path: Path, root: Path) -> dict:
    data = toml_file(path)
    package = data.get("package", {})
    return {
        "file": rel(path, root),
        "name": package.get("name"),
        "version": package.get("version"),
        "description": package.get("description"),
        "rust_version": package.get("rust-version"),
        "license": package.get("license"),
        "bins": [item.get("name") for item in data.get("bin", [])],
        "workspace": bool(data.get("workspace")),
    }


def go_mod(path: Path, root: Path) -> dict:
    text = read(path)
    module = re.search(r"^module\s+(\S+)", text, re.M)
    version = re.search(r"^go\s+(\S+)", text, re.M)
    return {"file": rel(path, root), "module": module.group(1) if module else None, "go": version.group(1) if version else None}


def license_info(path: Path, root: Path) -> dict:
    text = read(path, 20_000).lower()
    spdx = next((name for name, pattern in LICENSE_PATTERNS if re.search(pattern, text)), "unknown")
    return {"file": rel(path, root), "spdx_guess": spdx}


def env_names(path: Path, root: Path) -> dict:
    names = re.findall(r"^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=", read(path, 50_000), re.M)
    return {"file": rel(path, root), "variables": sorted(set(names))}


def readme_summary(path: Path, root: Path) -> dict:
    text = read(path)
    return {
        "file": rel(path, root),
        "lines": text.count("\n") + 1,
        "headings": re.findall(r"^#{1,3}\s+(.+)$", text, re.M)[:20],
        "images": len(re.findall(r"!\[|<img\b", text, re.I)),
        "badges": len(re.findall(r"shields\.io|badge\.svg|badgen\.net", text)),
        "centered": bool(re.search(r"align=[\"']?center", text)),
        "uses_picture": "<picture" in text.lower(),
    }


def style_signals(files: list[Path], root: Path) -> dict:
    hexes: Counter[str] = Counter()
    variables: Counter[str] = Counter()
    fonts: Counter[str] = Counter()
    sources: set[str] = set()
    for path in files:
        name = path.name.lower()
        is_style = path.suffix.lower() in STYLE_EXT
        is_token = any(hint in name for hint in TOKEN_HINTS) and path.suffix.lower() in {".js", ".ts", ".mjs", ".cjs", ".json"}
        is_layout = path.suffix.lower() in {".tsx", ".jsx", ".ts", ".js", ".html", ".astro", ".vue", ".svelte"} and (
            "layout" in name or name.startswith("_app") or name.startswith("_document") or name == "index.html"
        )
        if not (is_style or is_token or is_layout):
            continue
        text = read(path, 300_000)
        found = False
        for color in re.findall(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b", text):
            hexes[color.lower()] += 1
            found = True
        for variable in re.findall(r"(--[a-zA-Z0-9-]+)\s*:", text):
            variables[variable] += 1
            found = True
        for family in re.findall(r"font-family\s*:\s*([^;}{]+)", text):
            fonts[family.split(",")[0].strip().strip("\"'")] += 1
            found = True
        for family in re.findall(r"import\s*\{([^}]+)\}\s*from\s*[\"']next/font/(?:google|local)[\"']", text):
            for item in family.split(","):
                if item.strip():
                    fonts[item.strip().replace("_", " ")] += 1
                    found = True
        for family in re.findall(r"fonts\.googleapis\.com/css2?\?family=([^&\"':]+)", text):
            fonts[family.replace("+", " ")] += 1
            found = True
        if found:
            sources.add(rel(path, root))
    return {
        "top_colors": [color for color, _ in hexes.most_common(12)],
        "css_variables": [name for name, _ in variables.most_common(25)],
        "fonts": [name for name, _ in fonts.most_common(8)],
        "files": sorted(sources)[:20],
    }


def classify_image(path: Path, root: Path) -> dict:
    lowered = rel(path, root).lower()
    size = image_size(path)
    role = "logo" if any(hint in lowered for hint in LOGO_HINTS) else "screenshot" if any(hint in lowered for hint in SHOT_HINTS) else "other"
    return {
        "path": rel(path, root),
        "role_guess": role,
        "bytes": path.stat().st_size,
        "size": f"{size[0]}x{size[1]}" if size else None,
        "dark_variant": bool(re.search(r"(dark|night|black)", lowered)),
    }


def inspect(root: Path, max_files: int = 20_000) -> dict:
    files = walk(root, max_files)
    by_name: dict[str, list[Path]] = {}
    for path in files:
        by_name.setdefault(path.name.lower(), []).append(path)

    def find(name: str) -> list[Path]:
        return sorted(by_name.get(name.lower(), []), key=lambda p: len(p.parts))

    result: dict = {"root": str(root.resolve()), "files_scanned": len(files), "truncated": len(files) >= max_files}
    result["manifests"] = {
        "package.json": [package_json(p, root) for p in find("package.json")[:8]],
        "pyproject.toml": [pyproject(p, root) for p in find("pyproject.toml")[:4]],
        "Cargo.toml": [cargo(p, root) for p in find("Cargo.toml")[:4]],
        "go.mod": [go_mod(p, root) for p in find("go.mod")[:4]],
        "other": sorted(
            rel(p, root)
            for name in ("gemfile", "composer.json", "pubspec.yaml", "deno.json", "deno.jsonc", "setup.py", "setup.cfg",
                         "requirements.txt", "dockerfile", "docker-compose.yml", "compose.yaml", "makefile", "justfile",
                         "pnpm-workspace.yaml", "turbo.json", "skill.md")
            for p in find(name)[:3]
        ),
    }
    result["license"] = [license_info(p, root) for name in ("license", "license.md", "license.txt", "copying") for p in find(name)[:1]]
    result["readmes"] = [readme_summary(p, root) for p in files if re.match(r"readme(\.[a-z-]+)?\.md$", p.name, re.I)][:6]
    result["docs"] = sorted(
        {rel(p, root) for p in files if p.name.lower() in {"contributing.md", "changelog.md", "install.md", "agents.md", "claude.md", "security.md", "code_of_conduct.md"}}
        | {rel(p.parent, root) + "/" for p in files if p.parent.name.lower() in {"docs", "documentation", "website"} and p.suffix.lower() in {".md", ".mdx"}}
    )[:30]
    result["ci_workflows"] = sorted(rel(p, root) for p in files if ".github/workflows/" in rel(p, root) and p.suffix in {".yml", ".yaml"})
    result["env_examples"] = [env_names(p, root) for name in ENV_FILES for p in find(name)[:2]]
    images = [classify_image(p, root) for p in files if p.suffix.lower() in IMAGE_EXT]
    images.sort(key=lambda item: ({"logo": 0, "screenshot": 1, "other": 2}[item["role_guess"]], item["path"]))
    result["images"] = {"count": len(images), "logo_candidates": [i for i in images if i["role_guess"] == "logo"][:15],
                        "screenshot_candidates": [i for i in images if i["role_guess"] == "screenshot"][:15],
                        "other": [i for i in images if i["role_guess"] == "other"][:15]}
    result["style"] = style_signals(files, root)
    result["entrypoints"] = sorted(
        rel(p, root) for p in files
        if re.search(r"(^|/)(bin|cmd|cli)(/|$)", rel(p, root)) or p.name.lower() in {"cli.py", "__main__.py", "main.go", "main.rs", "cli.ts", "cli.js"}
    )[:20]
    return result


def to_markdown(data: dict) -> str:
    out = [f"# Repository map: {data['root']}", "", f"Files scanned: {data['files_scanned']}{' (truncated)' if data['truncated'] else ''}", ""]

    def section(title: str, rows: list[str]) -> None:
        out.append(f"## {title}")
        out.extend(rows or ["- none found"])
        out.append("")

    manifest_rows = []
    for kind, entries in data["manifests"].items():
        if kind == "other":
            manifest_rows += [f"- {path}" for path in entries]
            continue
        for entry in entries:
            details = ", ".join(f"{key}={value}" for key, value in entry.items() if key != "file" and value not in (None, [], {}, False, ""))
            manifest_rows.append(f"- `{entry['file']}`: {details}")
    section("Manifests", manifest_rows)
    section("License", [f"- `{item['file']}`: {item['spdx_guess']}" for item in data["license"]])
    section("READMEs", [f"- `{r['file']}`: {r['lines']} lines, {r['images']} images, {r['badges']} badges, centered={r['centered']}, picture={r['uses_picture']}; headings: {', '.join(r['headings'][:8])}" for r in data["readmes"]])
    section("Docs", [f"- {item}" for item in data["docs"]])
    section("CI workflows", [f"- {item}" for item in data["ci_workflows"]])
    section("Environment variables (names only)", [f"- `{e['file']}`: {', '.join(e['variables'])}" for e in data["env_examples"]])
    section("Entrypoints", [f"- {item}" for item in data["entrypoints"]])
    images = data["images"]
    image_rows = [f"- total: {images['count']}"]
    for key in ("logo_candidates", "screenshot_candidates", "other"):
        for item in images[key]:
            image_rows.append(f"- [{item['role_guess']}] `{item['path']}` {item['size'] or '?'} {item['bytes']}B{' dark' if item['dark_variant'] else ''}")
    section("Images", image_rows)
    style = data["style"]
    section("Style signals", [
        f"- colors: {', '.join(style['top_colors']) or 'none'}",
        f"- fonts: {', '.join(style['fonts']) or 'none'}",
        f"- css variables: {', '.join(style['css_variables'][:15]) or 'none'}",
        f"- from: {', '.join(style['files']) or 'none'}",
    ])
    out.append("Open the files above before deciding anything. This map does not judge the design.")
    return "\n".join(out)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("repo", type=Path)
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    parser.add_argument("--max-files", type=int, default=20_000)
    args = parser.parse_args(argv)
    if not args.repo.is_dir():
        print(f"Not a directory: {args.repo}", file=sys.stderr)
        return 2
    data = inspect(args.repo, args.max_files)
    print(json.dumps(data, indent=2) if args.format == "json" else to_markdown(data))
    return 0


if __name__ == "__main__":
    sys.exit(main())
