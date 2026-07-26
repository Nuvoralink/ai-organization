#!/usr/bin/env python3
import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "skills"

parser = argparse.ArgumentParser(description="Install SpecForge skills into a target repo .agents/skills directory.")
parser.add_argument("--target", required=True, help="Target repository root")
parser.add_argument("--force", action="store_true", help="Overwrite existing SpecForge skill folders")
args = parser.parse_args()

target_root = Path(args.target).resolve()
if not target_root.exists():
    raise SystemExit(f"Target does not exist: {target_root}")

dst = target_root / ".agents" / "skills"
dst.mkdir(parents=True, exist_ok=True)

for item in SRC.iterdir():
    if not item.is_dir():
        continue
    out = dst / item.name
    if out.exists():
        if not args.force:
            print(f"Skipping existing {out}. Use --force to overwrite.")
            continue
        shutil.rmtree(out)
    shutil.copytree(item, out)
    print(f"Installed {item.name}")

print(f"Done. Installed SpecForge skills into {dst}")
