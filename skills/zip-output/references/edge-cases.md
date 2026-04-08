# Edge Cases & Special Situations

Reference doc for `zip-output` skill. Read this when the standard workflow doesn't cleanly apply.

---

## 1. User Wants Files Flat (No Root Folder)

Sometimes the user explicitly wants files at the archive root — e.g. for a deployment pipeline that expects it.

**How to handle:**

- Confirm with the user: _"Just to check — do you want the files at the root of the ZIP, or inside a folder named X?"_
- If they confirm flat: use `zip` directly from inside the folder and note the deviation.
- Never assume flat unless explicitly stated.

---

## 2. Multiple Projects in One ZIP (Monorepo Export)

User wants `projects.zip` containing `project-a/` and `project-b/` side by side.

**How to handle:**

- Create a staging folder: `/home/claude/projects/`
- Inside it: `projects/project-a/...` and `projects/project-b/...`
- Run `build_zip.py /home/claude/projects /output/projects.zip`
- Result: `projects.zip/projects/project-a/` and `projects.zip/projects/project-b/` ✅

---

## 3. Very Large Number of Files (>500)

`build_zip.py` handles this fine — it uses `rglob` which streams lazily. No changes needed.

If the user needs progress feedback during a long pack, you can add a count printout by running with `tee`:

```bash
python build_zip.py /home/claude/big-project /output/big-project.zip | tee /tmp/zip-log.txt
wc -l /tmp/zip-log.txt  # rough file count
```

---

## 4. Preserving Symlinks

`zipfile` in Python does not preserve symlinks — they are followed and the target file is stored instead. This is acceptable for most use cases. If the user needs symlink preservation, note this limitation and suggest they use `tar.gz` instead.

---

## 5. Binary Files (images, fonts, compiled assets)

`build_zip.py` handles all file types. The `ZIP_DEFLATED` compression works on binary files but may not compress them much (e.g. already-compressed PNGs/JPGs). That's fine — the structure is still correct.

---

## 6. Output Path Doesn't Exist Yet

`build_zip.py` calls `output.parent.mkdir(parents=True, exist_ok=True)` so intermediate directories are created automatically.

---

## 7. User Provides an Existing ZIP to Fix

If the user uploads a badly structured ZIP and wants it fixed:

```bash
# 1. Extract to a temp folder
mkdir -p /home/claude/tmp-fix
cd /home/claude/tmp-fix
unzip /mnt/user-data/uploads/broken.zip

# 2. Check what's there
ls

# 3. If files are loose, move them into a root folder
mkdir -p /home/claude/my-project
mv /home/claude/tmp-fix/* /home/claude/my-project/

# 4. Re-package correctly
python build_zip.py /home/claude/my-project /mnt/user-data/outputs/my-project.zip

# 5. Verify
python verify_zip.py /mnt/user-data/outputs/my-project.zip
```

---

## 8. ZIP Name vs Root Folder Name Mismatch

The ZIP filename and the internal root folder name should match (minus the `.zip` extension). If the user asks for a custom internal name that differs from the filename, just set the source folder name accordingly before calling `build_zip.py`, since the script uses the source folder's name as the root.

```bash
# Want: archive.zip / my-cool-project/
mv /home/claude/my-cool-project /home/claude/my-cool-project  # already correct
python build_zip.py /home/claude/my-cool-project /output/archive.zip
```

---

## 9. Hidden Files (.env, .gitignore, etc.)

`build_zip.py` includes hidden files by default (e.g. `.env.example`, `.gitignore`). Only `.DS_Store` and `Thumbs.db` are excluded. This is intentional — dotfiles like `.gitignore` are part of the project structure.

If the user wants to exclude `.env` or similar sensitive files, add them to the `EXCLUDE_FILES` set before running, or manually delete them from the staging folder first.
