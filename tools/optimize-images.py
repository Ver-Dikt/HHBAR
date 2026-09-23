"""Recompress oversized site images without changing their URLs.

The originals remain recoverable from Git history. Run from any directory:
    python tools/optimize-images.py
"""

from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1] / "img"
MAX_EDGE = {
    "gallery": 1920,
    "kitchen": 1800,
    "Dj": 1600,
}
MIN_BYTES = 500_000


def optimize(path: Path) -> tuple[int, int]:
    before = path.stat().st_size
    if before < MIN_BYTES:
        return before, before
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source)
        limit = 1600 if path.suffix.lower() == ".png" else MAX_EDGE.get(path.relative_to(ROOT).parts[0], 1920)
        image.thumbnail((limit, limit), Image.Resampling.LANCZOS)
        output = BytesIO()
        if path.suffix.lower() == ".png":
            image.save(output, format="PNG", optimize=True, compress_level=9)
        else:
            image.convert("RGB").save(output, format="JPEG", quality=81, optimize=True, progressive=True, subsampling=0)
    data = output.getvalue()
    if len(data) < before:
        path.write_bytes(data)
        return before, len(data)
    return before, before


def main() -> None:
    old = new = changed = 0
    for path in sorted(ROOT.rglob("*")):
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        a, b = optimize(path)
        old += a
        new += b
        changed += a != b
    print(f"Images optimized: {changed}; total: {old / 1048576:.1f} -> {new / 1048576:.1f} MiB")


if __name__ == "__main__":
    main()
