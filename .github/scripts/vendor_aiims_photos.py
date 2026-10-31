#!/usr/bin/env python3
"""Download AIIMS campus images into the site so the gallery is self-hosted."""
from __future__ import annotations

import io
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "assets" / "app.js"
SW = ROOT / "sw.js"
OUT = ROOT / "assets" / "campuses"
OUT.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}

def slugify(name: str) -> str:
    value = name.lower().replace("(jammu)", "jammu")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value

def download_as_webp(url: str, destination: Path) -> tuple[bool, str]:
    try:
        response = requests.get(url, headers=HEADERS, timeout=(15, 50), allow_redirects=True)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "").lower()
        if not content_type.startswith("image/") and not response.content[:16].startswith(
            (b"\xff\xd8\xff", b"\x89PNG", b"RIFF", b"GIF8", b"BM")
        ):
            return False, f"not an image ({content_type or 'unknown content type'})"
        image = Image.open(io.BytesIO(response.content))
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((1800, 1200), Image.Resampling.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "WEBP", quality=84, method=6)
        if destination.stat().st_size < 5000:
            destination.unlink(missing_ok=True)
            return False, "image unexpectedly small"
        return True, f"{image.width}x{image.height}, {destination.stat().st_size} bytes"
    except Exception as exc:
        return False, f"{type(exc).__name__}: {exc}"

def main() -> int:
    source = APP.read_text(encoding="utf-8")
    campus_block_start = source.find("var campuses=[")
    campus_block_end = source.find("\n];", campus_block_start)
    if campus_block_start < 0 or campus_block_end < 0:
        print("Could not find the campuses data array", file=sys.stderr)
        return 2
    campus_block = source[campus_block_start:campus_block_end]
    object_pattern = re.compile(r"\{name:'([^']+)'([^}]*)\}")
    records = list(object_pattern.finditer(campus_block))
    if len(records) != 23:
        print(f"Expected 23 campus records; found {len(records)}", file=sys.stderr)
        return 2

    successes: list[tuple[str, str, str]] = []
    failures: list[tuple[str, str]] = []
    replacements: list[tuple[int, int, str]] = []
    manifest: list[dict[str, str]] = []

    for match in records:
        name, fields = match.group(1), match.group(2)
        photo_match = re.search(r"photo:'([^']+)'", fields)
        fallback_match = re.search(r"fallbackPhoto:'([^']+)'", fields)
        credit_match = re.search(r"credit:'([^']+)'", fields)
        if not photo_match:
            failures.append((name, "no photo URL in campus record"))
            continue
        primary = photo_match.group(1)
        fallback = fallback_match.group(1) if fallback_match else ""
        credit = credit_match.group(1) if credit_match else ""
        if primary.startswith("assets/"):
            local_path = ROOT / primary
            if local_path.exists():
                manifest.append({"campus": name, "file": primary, "source": credit})
                continue

        slug = slugify(name)
        destination = OUT / f"{slug}.webp"
        candidates = [primary]
        if fallback and fallback not in candidates:
            candidates.append(fallback)
        downloaded = False
        reasons = []
        for url in candidates:
            if url.startswith("assets/"):
                existing = ROOT / url
                if existing.exists():
                    destination = existing
                    downloaded = True
                    break
            ok, result = download_as_webp(url, destination)
            if ok:
                downloaded = True
                print(f"OK  {name}: {result} from {url}")
                break
            reasons.append(f"{url} -> {result}")
            print(f"FAIL {name}: {result}", file=sys.stderr)

        if not downloaded:
            failures.append((name, " | ".join(reasons) or "no source available"))
            continue

        local_url = destination.relative_to(ROOT).as_posix()
        # Replace only the photo field inside this campus' object.
        object_text = match.group(0)
        new_object = re.sub(r"photo:'[^']+'", f"photo:'{local_url}'", object_text, count=1)
        new_object = re.sub(r",fallbackPhoto:'[^']+'", "", new_object, count=1)
        object_start = campus_block_start + match.start()
        object_end = campus_block_start + match.end()
        replacements.append((object_start, object_end, new_object))
        successes.append((name, local_url, credit))
        manifest.append({"campus": name, "file": local_url, "source": credit})

    # Apply campus object replacements from right to left so offsets remain valid.
    for start, end, value in sorted(replacements, reverse=True):
        source = source[:start] + value + source[end:]
    if replacements:
        APP.write_text(source, encoding="utf-8")

    # Add local campus images to the service-worker precache list.
    local_files = sorted({entry["file"] for entry in manifest if entry.get("file", "").startswith("assets/")})
    sw_text = SW.read_text(encoding="utf-8")
    core_match = re.search(r"const CORE=\[(.*?)\];", sw_text, flags=re.S)
    if core_match:
        existing = re.findall(r"'([^']+)'", core_match.group(1))
        for file in local_files:
            token = "./" + file
            if token not in existing:
                existing.append(token)
        new_core = "const CORE=[" + ",".join(json.dumps(item) for item in existing) + "];"
        sw_text = sw_text[:core_match.start()] + new_core + sw_text[core_match.end():]
        sw_text = re.sub(r"the-last-mile-v\d+", "the-last-mile-v14", sw_text, count=1)
        SW.write_text(sw_text, encoding="utf-8")

    (OUT / "photo-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nDownloaded/available locally: {len(manifest)} of 23")
    if failures:
        print(f"Could not download: {len(failures)}", file=sys.stderr)
        for name, reason in failures:
            print(f"- {name}: {reason}", file=sys.stderr)
        # Keep successful images and commit them; failed ones remain identified
        # in the workflow log and are not silently replaced with unrelated photos.
    return 0 if manifest else 1

if __name__ == "__main__":
    raise SystemExit(main())
