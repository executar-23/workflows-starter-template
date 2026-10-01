#!/usr/bin/env python3
import json, sys
from pathlib import Path

def fail(msg):
    print("FAIL:", msg)
    sys.exit(1)

if len(sys.argv) != 2:
    fail("Usage: validate_plan.py plan.json")

path = Path(sys.argv[1])
if not path.exists():
    fail("Plan file not found.")

data = json.loads(path.read_text(encoding="utf-8"))

required = [
    "mode",
    "execution_approved",
    "objective",
    "scope",
    "phases",
    "quality_gates",
    "definition_of_done",
    "stop_state",
]

for key in required:
    if key not in data:
        fail(f"Missing key: {key}")

if data["mode"] != "PLAN":
    fail("mode must be PLAN for Plan Mode validation.")

if data["stop_state"] != "PLAN_READY":
    fail("stop_state must be PLAN_READY.")

if not isinstance(data["phases"], list) or not data["phases"]:
    fail("At least one phase is required.")

for idx, phase in enumerate(data["phases"], start=1):
    for key in ["id", "objective", "actions", "output", "gate"]:
        if key not in phase:
            fail(f"Phase {idx} missing: {key}")

print("PASS")
print(f"Validated: {path}")
