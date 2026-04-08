#!/usr/bin/env python3
"""
verify_zip.py — Verify a ZIP archive has the correct single-root-folder structure.

Prints the full tree and exits with code 0 if valid, 1 if not.

Usage:
    python verify_zip.py <path-to-zip>

Example:
    python verify_zip.py /mnt/user-data/outputs/my-project.zip
"""

import sys
import zipfile
from pathlib import Path


def verify_zip(zip_path: str) -> bool:
    path = Path(zip_path)

    if not path.exists():
        print(f"❌ File not found: {zip_path}")
        return False

    if not zipfile.is_zipfile(path):
        print(f"❌ Not a valid ZIP file: {zip_path}")
        return False

    with zipfile.ZipFile(path, "r") as zf:
        names = zf.namelist()

    if not names:
        print("❌ ZIP is empty.")
        return False

    # Collect top-level entries (first path component of each name)
    top_level = set()
    for name in names:
        parts = Path(name).parts
        if parts:
            top_level.add(parts[0])

    # Print the tree
    print(f"\n📂 Contents of: {path.name}")
    print("─" * 50)
    for name in sorted(names):
        indent = "  " * (len(Path(name).parts) - 1)
        leaf = Path(name).name
        is_dir = name.endswith("/")
        icon = "📁" if is_dir else "📄"
        print(f"  {indent}{icon} {leaf}")
    print("─" * 50)

    # Validate: exactly one top-level folder, no loose files
    loose_files = [n for n in names if not n.endswith("/") and len(Path(n).parts) == 1]
    multiple_roots = len(top_level) > 1

    if loose_files:
        print(f"\n❌ FAIL — Loose files found at ZIP root: {loose_files}")
        print("   Fix: Use build_zip.py to re-create the archive.")
        return False

    if multiple_roots:
        print(f"\n❌ FAIL — Multiple top-level entries found: {sorted(top_level)}")
        print("   Fix: All content must live under a single root folder.")
        return False

    root = sorted(top_level)[0]
    print(f"\n✅ PASS — Single root folder: {root}/")
    return True


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    ok = verify_zip(sys.argv[1])
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()