"""
Step 3 — Calculate frequency scores for each topic cluster.

Input:  data/clusters.json + data/raw_questions.json
Output: data/clusters_with_frequency.json

Frequency = number of distinct (year, session) papers that contain at
least one question from this cluster.

Tier assignment:
  HIGH   — appears in ≥ 6 out of 10 papers (≥60%)
  MEDIUM — appears in 3–5 papers (30–59%)
  LOW    — appears in 1–2 papers (<30%)
"""

import json
import os
from collections import defaultdict

from config import DATA_DIR

HIGH_THRESHOLD = 6   # out of 10 papers (5 years × 2 sessions)
MEDIUM_THRESHOLD = 3


def main():
    clusters_path = f"{DATA_DIR}/clusters.json"
    raw_path = f"{DATA_DIR}/raw_questions.json"

    if not os.path.exists(clusters_path):
        print(f"ERROR: {clusters_path} not found. Run 02_cluster_topics.py first.")
        return
    if not os.path.exists(raw_path):
        print(f"ERROR: {raw_path} not found. Run 01_extract_questions.py first.")
        return

    with open(clusters_path) as f:
        clusters = json.load(f)
    with open(raw_path) as f:
        questions = json.load(f)

    # Build question lookup: id → {year, session}
    q_lookup = {q["id"]: q for q in questions}

    result = []
    for cluster in clusters:
        question_ids = cluster.get("question_ids", [])

        # Collect distinct (year, session) papers this cluster appears in
        papers = set()
        for qid in question_ids:
            q = q_lookup.get(qid)
            if q:
                papers.add((q["year"], q["session"]))

        frequency_count = len(papers)

        # Tier
        if frequency_count >= HIGH_THRESHOLD:
            tier = "HIGH"
        elif frequency_count >= MEDIUM_THRESHOLD:
            tier = "MEDIUM"
        else:
            tier = "LOW"

        result.append({
            **cluster,
            "frequency_count": frequency_count,
            "frequency_tier": tier,
            "papers": sorted([f"{y}-{s}" for y, s in papers]),
        })

    # Sort within each course: HIGH first, then by frequency_count desc
    result.sort(key=lambda c: (-{"HIGH": 3, "MEDIUM": 2, "LOW": 1}[c["frequency_tier"]], -c["frequency_count"]))

    out_path = f"{DATA_DIR}/clusters_with_frequency.json"
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"── Frequency calculation complete ──")
    print(f"  Total clusters: {len(result)}")

    high = sum(1 for c in result if c["frequency_tier"] == "HIGH")
    medium = sum(1 for c in result if c["frequency_tier"] == "MEDIUM")
    low = sum(1 for c in result if c["frequency_tier"] == "LOW")
    print(f"  HIGH:   {high}")
    print(f"  MEDIUM: {medium}")
    print(f"  LOW:    {low}")
    print(f"  Output: {out_path}")


if __name__ == "__main__":
    main()
