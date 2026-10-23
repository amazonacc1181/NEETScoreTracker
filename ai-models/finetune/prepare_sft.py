#!/usr/bin/env python3
"""Validate and normalize NEET IQ supervised chat examples into JSONL."""
import argparse, json
from pathlib import Path
def normalize(row):
    messages=row.get("messages")
    if messages is None and "prompt" in row and "completion" in row:
        messages=[{"role":"user","content":str(row["prompt"])},{"role":"assistant","content":str(row["completion"])}]
    if not isinstance(messages,list) or len(messages)<2: raise ValueError("Each row needs messages[] or prompt/completion.")
    out=[]
    for m in messages:
        if not isinstance(m,dict) or m.get("role") not in ("system","user","assistant") or not str(m.get("content","")).strip():
            raise ValueError("Each message needs role system/user/assistant and non-empty content.")
        out.append({"role":m["role"],"content":str(m["content"]).strip()})
    if not any(m["role"]=="user" for m in out) or not any(m["role"]=="assistant" for m in out): raise ValueError("Each example must include user and assistant messages.")
    return {"messages":out}
def main():
    p=argparse.ArgumentParser();p.add_argument("input",type=Path);p.add_argument("output",type=Path);a=p.parse_args();count=0
    with a.input.open(encoding="utf-8") as src,a.output.open("w",encoding="utf-8") as dst:
        for no,line in enumerate(src,1):
            if not line.strip():continue
            try: row=normalize(json.loads(line))
            except Exception as e: raise SystemExit(f"Line {no}: {e}")
            dst.write(json.dumps(row,ensure_ascii=False)+"\n");count+=1
    if count==0:raise SystemExit("No training rows found.")
    print(f"Validated {count} supervised chat examples -> {a.output}")
if __name__=="__main__":main()
