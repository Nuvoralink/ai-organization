"""
store.py - persistence for council runs.

Each run is saved as one JSON record under ``data/runs/`` so an idea can be
re-opened or re-run later when evidence arrives (the 'assumptions that must be
true' become a checklist to revisit). Deliberately filesystem-only - no DB,
no service - to match a personal, local tool.
"""

from __future__ import annotations

import datetime as _dt
import json
import re
from pathlib import Path

# data/runs/ lives at the project root (one level above this package)
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "runs"


def _slug(text: str, limit: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "idea").lower()).strip("-")
    return (s[:limit] or "idea").strip("-")


def _now_stamp() -> str:
    return _dt.datetime.now().strftime("%Y%m%d-%H%M%S")


def save_run(idea: str, memo: dict, raw: dict | None = None) -> Path:
    """Persist a completed run. Returns the path written.

    ``raw`` optionally holds the intermediate artifacts (research brief, seat
    opinions, critiques) for later inspection / debugging.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    run_id = f"{_now_stamp()}-{_slug(idea)}"
    record = {
        "run_id": run_id,
        "created_at": _dt.datetime.now().isoformat(timespec="seconds"),
        "idea": idea,
        "memo": memo,
    }
    if raw is not None:
        record["raw"] = raw
    path = DATA_DIR / f"{run_id}.json"
    path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def load_run(run_id: str) -> dict:
    path = DATA_DIR / f"{run_id}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def list_runs() -> list[dict]:
    """Return run summaries (newest first)."""
    if not DATA_DIR.exists():
        return []
    runs = []
    for p in sorted(DATA_DIR.glob("*.json"), reverse=True):
        try:
            rec = json.loads(p.read_text(encoding="utf-8"))
            runs.append({
                "run_id": rec.get("run_id", p.stem),
                "created_at": rec.get("created_at"),
                "idea": rec.get("idea", ""),
                "verdict": rec.get("memo", {}).get("bottom_line", {}).get("verdict"),
            })
        except (json.JSONDecodeError, OSError):
            continue
    return runs
