#!/usr/bin/env python3
"""
build_zip.py — Create a correctly structured ZIP archive.

Guarantees that the archive has exactly one root folder named after the project,
so unzipping never dumps loose files into the user's current directory.

Usage:
    python build_zip.py <source-folder> <output-zip>

Example:
    python build_zip.py /home/claude/my-project /mnt/user-data/outputs/my-project.zip
"""

import sys
import zipfile
from pathlib import Path


EXCLUDE_DIRS  = {"__pycache__", "node_modules", ".git", ".venv", "venv", "dist", ".next"}
EXCLUDE_FILES = {".DS_Store", "Thumbs.db", ".gitkeep"}
EXCLUDE_EXTS  = {".pyc", ".pyo"}


def should_exclude(path: Path) -> bool:
    if path.name in EXCLUDE_FILES:
        return True
    if path.suffix in EXCLUDE_EXTS:
        return True
    for part in path.parts:
        if part in EXCLUDE_DIRS:
            return True
    return False


def build_zip(source_folder: str, output_zip: str) -> bool:
    """
    Create a ZIP where all files live under a single root folder.

    Args:
        source_folder: Path to the folder to zip.
        output_zip:    Destination .zip path (will be created/overwritten).

    Returns:
        True on success, False on error.
    """
    source = Path(source_folder).resolve()
    output = Path(output_zip).resolve()

    if not source.exists():
        print(f"❌ Source folder not found: {source}")
        return False

    if not source.is_dir():
        print(f"❌ Source is not a directory: {source}")
        return False

    # Root folder name inside the ZIP = name of source folder
    root_name = source.name
    output.parent.mkdir(parents=True, exist_ok=True)

    file_count = 0
    skipped_count = 0

    try:
        with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_path in sorted(source.rglob("*")):
                if not file_path.is_file():
                    continue

                rel = file_path.relative_to(source)

                if should_exclude(rel):
                    print(f"  ⏭  Skipped : {rel}")
                    skipped_count += 1
                    continue

                # Archive path: root_name/relative/path/to/file
                arcname = Path(root_name) / rel
                zf.write(file_path, arcname)
                print(f"  ✅ Added   : {arcname}")
                file_count += 1

        print(f"\n📦 Created: {output}")
        print(f"   Root folder : {root_name}/")
        print(f"   Files added : {file_count}")
        if skipped_count:
            print(f"   Files skipped: {skipped_count}")
        return True

    except Exception as e:
        print(f"❌ Failed to create ZIP: {e}")
        return False


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    source_folder = sys.argv[1]
    output_zip    = sys.argv[2]

    print(f"📦 Packaging: {source_folder}")
    print(f"   Output   : {output_zip}\n")

    success = build_zip(source_folder, output_zip)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
