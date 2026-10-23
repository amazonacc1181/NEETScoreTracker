#!/usr/bin/env python3
"""Validate NEET prompts for manual review; no model is downloaded in CI."""
import argparse,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument("--validate-only",action="store_true");p.add_argument("--dataset",default=str(Path(__file__).with_name("neet_eval.jsonl")));a=p.parse_args()
rows=[json.loads(x) for x in Path(a.dataset).read_text(encoding="utf-8").splitlines() if x.strip()]
assert len(rows)>=3,"Evaluation set unexpectedly small"
ids=set()
for r in rows:
 assert r["id"] not in ids,"Duplicate evaluation id";ids.add(r["id"])
 assert r.get("subject") in {"Physics","Chemistry","Biology"}
 assert isinstance(r.get("prompt"),str) and r["prompt"].strip()
 assert isinstance(r.get("expected_concepts"),list) and r["expected_concepts"]
print(f"Validated {len(rows)} NEET evaluation prompts. Model scoring is manual and must be run on-device.")
