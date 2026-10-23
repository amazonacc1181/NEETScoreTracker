#!/usr/bin/env python3
"""
Train a small, dependency-free topic-risk calibration model from question attempts.

Input CSV columns:
  subject,chapter,difficulty,correct
where correct is 1/0/true/false. This script calibrates the baseline prior error rate
and difficulty adjustment, not a language model or answer key.

Usage:
  python ai-models/train_topic_risk.py question_attempts.csv app/src/main/assets/neet_topic_risk_model.json
"""
import csv
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

def parse_bool(value):
    return str(value).strip().lower() in {"1", "true", "yes", "correct", "right"}

def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: train_topic_risk.py input.csv output.json")
    source, target = map(Path, sys.argv[1:])
    rows = []
    with source.open(newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            if "correct" not in row:
                raise SystemExit("CSV is missing the required 'correct' column.")
            difficulty = str(row.get("difficulty", "medium")).strip().lower()
            difficulty_score = 1.5 if difficulty in {"hard", "difficult"} else 0.65 if difficulty == "easy" else 1.0
            rows.append((parse_bool(row["correct"]), difficulty_score))
    if not rows:
        raise SystemExit("No question-attempt rows found.")
    wrong_rate = sum(not correct for correct, _ in rows) / len(rows)
    mean_difficulty = sum(d for _, d in rows) / len(rows)
    # Stable calibration with shrinkage, to avoid overreacting to small samples.
    prior_error = min(0.65, max(0.10, (wrong_rate * len(rows) + 1.12) / (len(rows) + 4.0)))
    difficulty_weight = min(0.30, max(0.08, 0.18 + 0.08 * (mean_difficulty - 1.0)))
    result = {
        "model_name": "NEET Topic Risk Model",
        "version": 1,
        "method": "Bayesian-smoothed topic error estimate with difficulty and repeated-error signals",
        "prior_error_rate": round(prior_error, 4),
        "prior_attempts": 4.0,
        "difficulty_weight": round(difficulty_weight, 4),
        "repeat_error_weight": 0.12,
        "training_rows": len(rows),
        "note": "Calibrated from question-attempt data; not a generative LLM or official NEET answer key."
    }
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"rows": len(rows), "prior_error_rate": prior_error, "output": str(target)}, indent=2))

if __name__ == "__main__":
    main()
