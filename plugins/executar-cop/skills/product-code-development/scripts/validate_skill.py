#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
required = [
    "SKILL.md",
    "SESSION_GUIDE_BASE.md",
    "references/CAPABILITY_MAP.md",
    "references/ENGINEERING_CAPABILITIES.md",
    "references/PRODUCT_MANAGEMENT_CAPABILITIES.md",
    "references/GAP_AND_EVIDENCE_POLICY.md",
    "references/SOURCE_MANIFEST.md",
    "workflows/WORKFLOW_INDEX.md",
    "workflows/WF-03-CODE-IMPLEMENTATION-PLAN.md",
    "templates/PLAN_MODE_CONTRACT.md",
]
errors = []
for rel in required:
    if not (ROOT / rel).exists():
        errors.append(f"missing: {rel}")

skill = ROOT / "SKILL.md"
if skill.exists():
    text = skill.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        errors.append("SKILL.md: missing YAML frontmatter")
    fm = text.split("---", 2)[1] if text.count("---") >= 2 else ""
    for field in ["name:", "description:"]:
        if field not in fm:
            errors.append(f"SKILL.md: missing frontmatter field {field}")

md_link = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
for md in ROOT.rglob("*.md"):
    text = md.read_text(encoding="utf-8")
    for target in md_link.findall(text):
        if target.startswith(("http://", "https://", "#")):
            continue
        clean = target.split("#", 1)[0]
        if clean and not (md.parent / clean).resolve().exists():
            errors.append(f"{md.relative_to(ROOT)}: broken link -> {target}")

if errors:
    print("FAIL")
    for e in errors:
        print("-", e)
    sys.exit(1)

print("PASS")
print(f"Skill directory valid: {ROOT}")
