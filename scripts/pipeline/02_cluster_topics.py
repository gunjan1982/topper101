"""
Step 2 — Cluster questions by topic using DeepSeek.

Input:  data/raw_questions.json
Output: data/clusters.json

For each course, sends all unique question texts to DeepSeek and asks it to
group them into 8–15 topic clusters, name each cluster, and assign every
question to one cluster.

Processes one course at a time to stay within token limits.
Saves progress incrementally — safe to re-run after interruption.
"""

import json
import os
import time
from pathlib import Path
from collections import defaultdict

from config import client, MODEL, DATA_DIR, ALL_COURSES

PROGRESS_PATH = f"{DATA_DIR}/clusters_progress.json"


def load_progress() -> dict:
    if os.path.exists(PROGRESS_PATH):
        with open(PROGRESS_PATH) as f:
            return json.load(f)
    return {}


def save_progress(progress: dict):
    with open(PROGRESS_PATH, "w") as f:
        json.dump(progress, f, indent=2)


def cluster_course(course_code: str, course_name: str, questions: list[dict]) -> list[dict]:
    """
    Ask DeepSeek to cluster all questions for a course into named topic groups.
    Returns list of cluster dicts with assigned question IDs.
    """
    # Build numbered list of question texts
    q_list = "\n".join(
        f"{i+1}. [{q['section']}{q['marks']}m] {q['question_text'][:200]}"
        for i, q in enumerate(questions)
    )

    prompt = f"""You are an expert in IGNOU MAPC psychology curriculum.

Below are {len(questions)} exam questions from the course "{course_name}" ({course_code}).

Group these questions into 8–15 meaningful topic clusters. Each cluster should:
- Have a short, descriptive name (3–6 words)
- Contain questions that cover the same core topic or concept
- Have at least 2 questions (merge very small clusters)

Questions:
{q_list}

Return ONLY valid JSON in this exact format — no markdown, no explanation:
{{
  "clusters": [
    {{
      "cluster_name": "Short Topic Name",
      "description": "One sentence describing what this cluster covers.",
      "question_numbers": [1, 5, 12, 18]
    }}
  ]
}}

Every question number from 1 to {len(questions)} must appear in exactly one cluster."""

    for attempt in range(3):
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=4000,
            )
            raw = resp.choices[0].message.content.strip()

            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = re.sub(r'^```[a-z]*\n?', '', raw)
                raw = raw.rstrip('`').strip()

            data = json.loads(raw)
            clusters = data.get("clusters", [])

            # Validate all question numbers are covered
            all_assigned = set()
            for c in clusters:
                all_assigned.update(c.get("question_numbers", []))
            expected = set(range(1, len(questions) + 1))
            missing = expected - all_assigned

            if missing:
                print(f"    [WARN] {len(missing)} questions unassigned in clustering response — assigning to 'Other'")
                clusters.append({
                    "cluster_name": "Other Topics",
                    "description": "Miscellaneous questions not fitting the main clusters.",
                    "question_numbers": list(missing),
                })

            # Replace question_numbers with actual question IDs
            result = []
            for c in clusters:
                question_ids = []
                for num in c.get("question_numbers", []):
                    idx = num - 1
                    if 0 <= idx < len(questions):
                        question_ids.append(questions[idx]["id"])
                result.append({
                    "cluster_name": c["cluster_name"],
                    "description": c.get("description", ""),
                    "course_code": course_code,
                    "question_ids": question_ids,
                })
            return result

        except json.JSONDecodeError as e:
            print(f"    [RETRY {attempt+1}] JSON parse error: {e}")
            time.sleep(2)
        except Exception as e:
            print(f"    [RETRY {attempt+1}] API error: {e}")
            time.sleep(5)

    raise RuntimeError(f"Failed to cluster {course_code} after 3 attempts")


def main():
    import re  # needed for markdown stripping in cluster_course

    raw_path = f"{DATA_DIR}/raw_questions.json"
    if not os.path.exists(raw_path):
        print(f"ERROR: {raw_path} not found. Run 01_extract_questions.py first.")
        return

    with open(raw_path) as f:
        all_questions = json.load(f)

    # Group by course
    by_course = defaultdict(list)
    for q in all_questions:
        by_course[q["course_code"]].append(q)

    # Load progress (allows resuming)
    progress = load_progress()
    all_clusters = list(progress.values()) if progress else []
    # Flatten existing clusters into a list if progress stores per-course
    if progress and isinstance(list(progress.values())[0], list):
        all_clusters = [c for clusters in progress.values() for c in clusters]

    course_map = {c["code"]: c["name"] for c in ALL_COURSES}

    for course_code, questions in sorted(by_course.items()):
        if course_code in progress:
            print(f"[SKIP] {course_code} already clustered ({len(progress[course_code])} clusters)")
            continue

        course_name = course_map.get(course_code, course_code)
        print(f"\nClustering {course_code} ({course_name}) — {len(questions)} questions...")

        try:
            clusters = cluster_course(course_code, course_name, questions)
            progress[course_code] = clusters
            all_clusters.extend(clusters)
            save_progress(progress)
            print(f"  → {len(clusters)} clusters created")
            time.sleep(1)  # Rate limiting
        except Exception as e:
            print(f"  [ERR] {course_code}: {e}")
            print(f"  Skipping — re-run script to retry this course")

    # Write final output
    out_path = f"{DATA_DIR}/clusters.json"
    with open(out_path, "w") as f:
        json.dump(all_clusters, f, indent=2, ensure_ascii=False)

    print(f"\n── Clustering complete ──")
    print(f"  Total clusters: {len(all_clusters)}")
    print(f"  Output: {out_path}")


if __name__ == "__main__":
    import re
    main()
