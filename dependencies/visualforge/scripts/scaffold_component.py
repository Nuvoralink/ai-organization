"""Scaffold a new component spec file from the 16-section template.

Usage:
    python scripts/scaffold_component.py <Name> --category <primitive|composite|pattern|domain> \\
        --dec <DEC-NNN> [--root docs/design-system]

Examples:
    python scripts/scaffold_component.py DatePicker --category composite --dec DEC-470
    python scripts/scaffold_component.py FilterBar --category pattern --dec DEC-475 --root docs/ds

The output goes to `<root>/05-components/<category-plural>/<Name>.md`. The file follows the
16-section template defined in `docs/design-system/05-components/overview.md` and the
opinionated-decision-template (Cross-cites consumed / Confidence / Reversal trigger).

Refuses to overwrite an existing file unless `--force` is given. Validates DEC-NNN shape
and that the DEC-ID is not already used as a `### DEC-NNN` heading elsewhere in the tree.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


CATEGORY_DIR = {
    "primitive": "primitives",
    "composite": "composites",
    "pattern": "patterns",
    "domain": "domain",
}

DEC_RE = re.compile(r"^DEC-(\d{3,4})(?:\.\d+)?$")
HEADING_RE = re.compile(r"^###\s+\[?DEC-(\d{3,4}(?:\.\d+)?)\]?", re.MULTILINE)


TEMPLATE = """<!-- visualforge: scaffold scope=component generated-by=scaffold_component.py -->

# {name} ({category})

## Purpose
TODO — one paragraph: what this component does, when to reach for it, when NOT to.

## Library source + adoption mode
- Source: TODO — Radix / cmdk / native / custom.
- Mode: Wrap / Custom / Adopt-and-extend in `src/components/{category_path}/{name_lower}.tsx`.

## Variants
| Variant | Use case |
|---|---|
| `default` | TODO |

## Sizes
| Size | Height / scale | Use |
|---|---|---|
| `sm` | `size.X` | TODO |
| `md` (default) | `size.X` | TODO |
| `lg` | `size.X` | TODO |

## Slots
- `trigger`: TODO
- `content`: TODO

## Props
| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | string | `'default'` | |

## States and bound tokens
| State | tokens |
|---|---|
| `rest` | TODO |
| `hover` | TODO |
| `focus-visible` | TODO |
| `disabled` | TODO |
| `error` (only for form-input components) | TODO |

## Motion
- TODO — duration / easing tokens per `04-interaction/motion-design.md` (DEC-792 / DEC-794).
- Reduced-motion: TODO.

## Accessibility contract
- Role: TODO.
- Label: TODO.
- Keyboard: TODO.
- ARIA: TODO.
- Touch target: ≥ 44×44 effective area (DEC-710).
- Color contrast: per DEC-720 / DEC-700.
- Reduced motion: honored (DEC-714).
- High-contrast: TODO.

## Responsive behavior
TODO — container-query collapse points if any.

## Composition rules
- **Used inside**: TODO.
- **Never inside**: TODO.

## Anti-pattern
- TODO.

## Token bindings
```
TODO
```

## Test expectations
- Storybook: TODO per variant × per size.
- Visual regression: TODO.
- a11y: axe per story.
- Reduced-motion: TODO.

## Decision card

### {dec} — {name} {category} — TODO short title (5-12 words)
**Cross-cites consumed:** TODO list (or `none` for foundational).
**Confidence:** TODO (High / Medium).
**Reversal trigger:** TODO (specific observable signal; `none` if floor decision).

## What we are intentionally NOT doing
- **Not** TODO.

## Sources and basis
- TODO library docs.
- WCAG / WAI-ARIA pattern.
- Cross-cites: {dec}.
"""


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Scaffold a new VF component spec.")
    p.add_argument("name", help="Component name in PascalCase (e.g. DatePicker)")
    p.add_argument(
        "--category",
        required=True,
        choices=list(CATEGORY_DIR.keys()),
        help="Component category.",
    )
    p.add_argument("--dec", required=True, help="DEC-NNN ID for the component's decision card.")
    p.add_argument(
        "--root",
        default="docs/design-system",
        help="Root of the design-system docs (default: docs/design-system).",
    )
    p.add_argument(
        "--force",
        action="store_true",
        help="Overwrite if the target file exists.",
    )
    return p.parse_args()


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

    args = parse_args()

    if not args.name[:1].isupper():
        print(f"FAIL: component name should be PascalCase, got {args.name!r}", file=sys.stderr)
        return 2
    if not DEC_RE.match(args.dec):
        print(
            f"FAIL: invalid DEC-ID {args.dec!r}; expected DEC-NNN or DEC-NNN.M.",
            file=sys.stderr,
        )
        return 2

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"FAIL: design-system root not found: {root}", file=sys.stderr)
        return 2

    target_dir = root / "05-components" / CATEGORY_DIR[args.category]
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"{args.name}.md"

    if target.exists() and not args.force:
        print(f"FAIL: target already exists: {target}; pass --force to overwrite", file=sys.stderr)
        return 2

    # VF-FIND-001 awareness: refuse to scaffold a DEC-NNN that already has a heading elsewhere.
    dec_id = args.dec.split("-", 1)[1]
    skip_dirs = {"figma-import-bundle", "auditability"}
    for md in root.rglob("*.md"):
        rel = md.relative_to(root)
        if any(part in skip_dirs for part in rel.parts):
            continue
        if md == target:
            continue
        try:
            text = md.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for m in HEADING_RE.finditer(text):
            if m.group(1) == dec_id:
                print(
                    f"FAIL: {args.dec} already used as `### {args.dec}` heading in "
                    f"{rel}. Pick a free DEC-ID or use sub-decision DEC-{dec_id}.N.",
                    file=sys.stderr,
                )
                return 2

    body = TEMPLATE.format(
        name=args.name,
        category=args.category,
        category_path=CATEGORY_DIR[args.category],
        name_lower=args.name.lower(),
        dec=args.dec,
    )
    target.write_text(body, encoding="utf-8")
    print(f"OK: scaffolded {target.relative_to(root)} for {args.dec}")
    print("Next steps:")
    print(f"  1. Fill TODOs in {target.relative_to(root)}.")
    print(f"  2. Add {args.dec} entry in auditability/decision-log.md.")
    print(f"  3. Add row to 05-components/_index.md.")
    print(f"  4. Run validator: python scripts/validate_design_docs.py --root {args.root} --mid-run")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
