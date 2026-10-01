#!/usr/bin/env python3
from pathlib import Path
import sys, re

ROOT = Path(__file__).resolve().parents[1]

required = [
    ROOT / "SKILL.md",
    ROOT / "contracts" / "PLAN-MODE-CORE.contract.md",
    ROOT / "contracts" / "CODEX-PLAN-MODE.contract.md",
    ROOT / "contracts" / "CLAUDE-CODE-PLAN-MODE.contract.md",
    ROOT / "contracts" / "EVIDENCE-TRACEABILITY.contract.md",
    ROOT / "contracts" / "OUTPUT-QUALITY.contract.md",
    ROOT / "schemas" / "plan.schema.json",
    ROOT / "adapters" / "codex" / "AGENTS.template.md",
    ROOT / "adapters" / "claude-code" / "CLAUDE.template.md",
]

errors = []

for p in required:
    if not p.exists():
        errors.append(f"Missing: {p.relative_to(ROOT)}")

skill = ROOT / "SKILL.md"
if skill.exists():
    text = skill.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        errors.append("SKILL.md must start with YAML frontmatter.")
    if "name: executar-plan-mode" not in text:
        errors.append("Skill name must be executar-plan-mode.")
    if "description:" not in text:
        errors.append("SKILL.md description is missing.")

if (ROOT / "README.md").exists():
    errors.append("README.md should not exist inside the Skill directory.")

if errors:
    print("FAIL")
    for e in errors:
        print("-", e)
    sys.exit(1)

print("PASS")
print(f"Validated {ROOT.name}")
