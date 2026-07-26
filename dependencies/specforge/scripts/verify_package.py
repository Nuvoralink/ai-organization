#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
PUBLISHING_PLACEHOLDERS = ["YOUR_GITHUB_USERNAME"]
TEMPLATE_PLACEHOLDERS = ["[app name]", "[platform/type]", "[target user]", "[problem]", "[add "]

manifest = ROOT / ".codex-plugin" / "plugin.json"
if not manifest.exists():
    errors.append("Missing .codex-plugin/plugin.json")
else:
    try:
        manifest_text = manifest.read_text(encoding="utf-8")
        data = json.loads(manifest_text)
        for key in ["name", "version", "description", "skills"]:
            if key not in data:
                errors.append(f"Plugin manifest missing {key}")
        if data.get("name") != "specforge":
            errors.append("Plugin manifest name should be specforge")
        for marker in PUBLISHING_PLACEHOLDERS:
            if marker in manifest_text:
                errors.append(f"Plugin manifest still contains publishing placeholder {marker}")
    except Exception as exc:
        errors.append(f"Invalid plugin manifest JSON: {exc}")

skills_dir = ROOT / "skills"
if not skills_dir.exists():
    errors.append("Missing skills directory")
else:
    skill_files = sorted(skills_dir.glob("*/SKILL.md"))
    if not skill_files:
        errors.append("No SKILL.md files found")
    for skill in skill_files:
        text = skill.read_text(encoding="utf-8")
        parts = text.split("---", 2)
        if not text.startswith("---") or len(parts) < 3:
            errors.append(f"Missing front matter: {skill}")
            continue
        frontmatter = parts[1]
        if "name:" not in frontmatter:
            errors.append(f"Missing name in front matter: {skill}")
        if "description:" not in frontmatter:
            errors.append(f"Missing description in front matter: {skill}")
        for line_no, line in enumerate(text.splitlines(), start=1):
            if line.startswith("    ## "):
                errors.append(f"Likely code-blocked markdown heading in {skill}:{line_no}")

required = [
    "README.md",
    "LICENSE",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "PROMPT_LIBRARY.md",
    "USAGE_GUIDE.md",
    "scripts/quality_selftest.py",
    "skills/_specforge-shared/scripts/validate_app_docs.py",
    "skills/_specforge-shared/scripts/validate_implementation_artifacts.py",
    "skills/_specforge-shared/references/document-specification.md",
    "skills/_specforge-shared/references/document-quality-acceptance-tests.md",
    "skills/_specforge-shared/references/evolutionary-architecture-doctrine.md",
    "skills/specforge-assurance-architecture/SKILL.md",
    "skills/specforge-discovery-interview/SKILL.md",
    "skills/specforge-discovery-interview/references/question-repository.md",
    "skills/_specforge-shared/references/assurance-source-of-truth-patterns.md",
    "examples/golden/greenfield-focused/docs/app-plan/product/02-prd.md",
    "examples/golden/implementation-artifacts/docs/app-plan/implementation/vertical-slice-specs.md",
    "examples/golden/implementation-artifacts/docs/app-plan/implementation/verification-and-test-harness.md",
    "examples/golden/existing-repo-repair/docs/app-plan/auditability/documentation-audit.md",
    "examples/fixtures/bad/surface-level-docs/docs/app-plan/02-prd.md",
    "examples/fixtures/bad/implementation-artifacts/docs/app-plan/implementation/vertical-slice-specs.md",
]
for rel in required:
    if not (ROOT / rel).exists():
        errors.append(f"Missing {rel}")

template = ROOT / "skills" / "_specforge-shared" / "assets" / "templates" / "AGENTS.template.md"
if template.exists():
    template_text = template.read_text(encoding="utf-8")
    for marker in TEMPLATE_PLACEHOLDERS:
        if marker in template_text:
            errors.append(f"AGENTS.template.md still contains placeholder marker {marker}")

if errors:
    print("SpecForge package verification failed:\n")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("SpecForge package verification passed.")



