"""
Step 5 — Seed questions, topic clusters, and answers into Supabase.

Inputs:
  data/questions_with_answers.json
  data/clusters_with_frequency.json

Uses the service role key to bypass RLS.
Safe to re-run — uses upsert on all tables.
"""

import json
import os
from pathlib import Path

from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATA_DIR, ALL_COURSES

BATCH_SIZE = 50


def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def batch(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def upsert_courses(supabase: Client):
    """Ensure all 16 theory courses exist."""
    print("\n── Upserting courses ──")
    rows = [
        {
            "code": c["code"],
            "name": c["name"],
            "year": c["year"],
            "stream": c.get("stream"),
        }
        for c in ALL_COURSES
    ]
    resp = supabase.table("courses").upsert(rows, on_conflict="code").execute()
    print(f"  {len(rows)} courses upserted")


def upsert_clusters(supabase: Client, clusters: list[dict]) -> dict:
    """
    Upsert topic_clusters. Returns mapping cluster_name+course_code → cluster UUID.
    """
    print("\n── Upserting topic clusters ──")

    # Fetch course_id map
    resp = supabase.table("courses").select("id, code").execute()
    course_id_map = {r["code"]: r["id"] for r in resp.data}

    cluster_id_map = {}  # (course_code, cluster_name) → uuid

    for chunk in batch(clusters, BATCH_SIZE):
        rows = []
        for c in chunk:
            course_id = course_id_map.get(c["course_code"])
            if not course_id:
                print(f"  [WARN] No course_id for {c['course_code']} — skipping cluster")
                continue
            rows.append({
                "course_id": course_id,
                "cluster_name": c["cluster_name"],
                "description": c.get("description", ""),
                "frequency_count": c.get("frequency_count", 0),
                "frequency_tier": c.get("frequency_tier", "LOW"),
            })

        if not rows:
            continue

        resp = supabase.table("topic_clusters").upsert(
            rows, on_conflict="course_id,cluster_name"
        ).execute()

    # Fetch back to get IDs
    resp = supabase.table("topic_clusters").select("id, course_id, cluster_name").execute()
    course_code_for_id = {v: k for k, v in course_id_map.items()}
    for row in resp.data:
        course_code = course_code_for_id.get(row["course_id"])
        if course_code:
            cluster_id_map[(course_code, row["cluster_name"])] = row["id"]

    print(f"  {len(cluster_id_map)} cluster IDs fetched")
    return cluster_id_map


def upsert_questions(supabase: Client, questions: list[dict],
                     cluster_id_map: dict, clusters: list[dict]):
    """
    Insert questions mapped to the live DB schema.
    Live columns: course_id, question_text, question_type, marks, model_answer,
                  answer_generated_by, frequency_tag, topic, is_published,
                  year, session, section
    """
    print("\n── Inserting questions ──")

    # Build question_id → (cluster_name, frequency_tier) lookup
    q_to_cluster = {}
    for c in clusters:
        for qid in c.get("question_ids", []):
            q_to_cluster[qid] = {
                "topic": c["cluster_name"],
                "frequency_tag": c.get("frequency_tier", "LOW").lower(),
            }

    # Section → question_type mapping
    SECTION_TYPE = {"A": "long", "B": "medium", "C": "short"}

    # Fetch course_id map
    resp = supabase.table("courses").select("id, code").execute()
    course_id_map = {r["code"]: r["id"] for r in resp.data}

    inserted = 0
    skipped = 0

    for chunk in batch(questions, BATCH_SIZE):
        rows = []
        for q in chunk:
            course_id = course_id_map.get(q["course_code"])
            if not course_id:
                skipped += 1
                continue

            cluster_info = q_to_cluster.get(q["id"], {})
            ai_model = q.get("ai_model_used") or ""
            answer_by = "deepseek" if "deepseek" in ai_model.lower() else None

            rows.append({
                "course_id": course_id,
                "question_text": q["question_text"],
                "question_type": SECTION_TYPE.get(q.get("section", "B"), "medium"),
                "marks": q["marks"],
                "model_answer": q.get("ai_answer"),
                "answer_generated_by": answer_by,
                "frequency_tag": cluster_info.get("frequency_tag"),
                "topic": cluster_info.get("topic"),
                "is_published": False,
                "year": q.get("year"),
                "session": q.get("session"),
                "section": q.get("section"),
            })

        if not rows:
            continue

        resp = supabase.table("questions").insert(rows).execute()
        inserted += len(rows)

    print(f"  {inserted} questions inserted, {skipped} skipped (unknown course)")


def main():
    qa_path = f"{DATA_DIR}/questions_with_answers.json"
    clusters_path = f"{DATA_DIR}/clusters_with_frequency.json"

    if not os.path.exists(qa_path):
        print(f"ERROR: {qa_path} not found. Run 04_generate_answers.py first.")
        return
    if not os.path.exists(clusters_path):
        print(f"ERROR: {clusters_path} not found. Run 03_calculate_frequency.py first.")
        return

    with open(qa_path) as f:
        questions = json.load(f)
    with open(clusters_path) as f:
        clusters = json.load(f)

    supabase = get_supabase()

    upsert_courses(supabase)
    cluster_id_map = upsert_clusters(supabase, clusters)
    upsert_questions(supabase, questions, cluster_id_map, clusters)

    # Summary
    resp = supabase.table("questions").select("id", count="exact").execute()
    total_q = resp.count
    resp = supabase.table("topic_clusters").select("id", count="exact").execute()
    total_c = resp.count

    print(f"\n── Seeding complete ──")
    print(f"  Questions in DB:      {total_q}")
    print(f"  Topic clusters in DB: {total_c}")


if __name__ == "__main__":
    main()
