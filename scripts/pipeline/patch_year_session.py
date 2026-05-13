"""
One-shot patch: update year, session, section on all questions in the DB.

Matches on question_text (the only unique-ish field we have post-seeding).
Safe to re-run — only updates rows where year IS NULL.
"""

import json
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env.local'))

from supabase import create_client

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
DATA_DIR = os.path.join(os.path.dirname(__file__), "../../data")

BATCH_SIZE = 50


def batch(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def main():
    with open(f"{DATA_DIR}/questions_with_answers.json") as f:
        source = json.load(f)

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # Fetch all DB questions (id + question_text)
    resp = supabase.table("questions").select("id, question_text, year").execute()
    db_questions = resp.data
    print(f"DB questions fetched: {len(db_questions)}")

    # Build lookup: question_text → DB id
    db_map = {q["question_text"].strip(): q["id"] for q in db_questions}

    # Build update list
    updates = []
    unmatched = 0
    for q in source:
        db_id = db_map.get(q["question_text"].strip())
        if not db_id:
            unmatched += 1
            continue
        updates.append({
            "id": db_id,
            "year": q.get("year"),
            "session": q.get("session"),
            "section": q.get("section"),
        })

    print(f"Matched: {len(updates)}, Unmatched: {unmatched}")

    updated = 0
    for chunk in batch(updates, BATCH_SIZE):
        resp = supabase.table("questions").upsert(chunk, on_conflict="id").execute()
        updated += len(chunk)
        print(f"  Updated {updated}/{len(updates)}...", end="\r")

    print(f"\nDone. {updated} questions patched.")


if __name__ == "__main__":
    main()
