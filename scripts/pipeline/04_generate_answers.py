"""
Step 4 — Generate AI answers for all questions using DeepSeek.

Input:  data/raw_questions.json
Output: data/questions_with_answers.json

- Processes questions concurrently (10 workers) for ~10x speedup.
- Saves progress incrementally — safe to re-run after interruption.
- Never fabricates answers: if DeepSeek fails after retries, marks as failed
  and continues. Failed questions are listed in data/answer_failures.json.
- Word count targets:
    10 marks → 600–800 words
    6 marks  → 350–450 words
    3 marks  → 150–200 words
"""

import json
import os
import time
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from config import client, MODEL, DATA_DIR, ALL_COURSES

PROGRESS_PATH = f"{DATA_DIR}/answer_progress.json"
MAX_WORKERS = 10  # concurrent DeepSeek requests

WORD_TARGETS = {
    10: "600–800",
    6:  "350–450",
    3:  "150–200",
}

course_map = {c["code"]: c["name"] for c in ALL_COURSES}
_progress_lock = threading.Lock()


def word_target(marks: int) -> str:
    if marks >= 10:
        return WORD_TARGETS[10]
    elif marks >= 6:
        return WORD_TARGETS[6]
    else:
        return WORD_TARGETS[3]


def generate_answer(course_code: str, question_text: str, marks: int,
                    section: str) -> dict | None:
    """
    Call DeepSeek to generate a model answer. Returns dict with answer_text
    and word_count, or None if all retries failed.
    """
    course_name = course_map.get(course_code, course_code)
    target = word_target(marks)

    prompt = f"""You are an expert IGNOU MAPC examiner and psychology educator.

Write a model answer for the following IGNOU MAPC exam question.

Course: {course_name} ({course_code})
Section: {section}
Marks: {marks}
Target length: {target} words

Question: {question_text}

Requirements:
- Write in essay format suitable for IGNOU TEE answer scripts
- Structure: Introduction → Body paragraphs with subheadings → Conclusion
- Use correct psychological terminology throughout
- Reference key theorists and researchers by name where relevant
- Be specific and factual — do not fabricate citations or statistics
- Match the depth to the marks allocated ({marks} marks = {target} words)

Return ONLY valid JSON — no markdown, no explanation:
{{"answer_text": "...", "word_count": 0}}"""

    for attempt in range(3):
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000,
            )
            raw = resp.choices[0].message.content.strip()

            # Strip markdown fences
            if raw.startswith("```"):
                raw = re.sub(r'^```[a-z]*\n?', '', raw)
                raw = raw.rstrip('`').strip()

            data = json.loads(raw)

            answer_text = data.get("answer_text", "").strip()
            word_count = data.get("word_count", 0)

            if not answer_text or len(answer_text) < 50:
                raise ValueError(f"Answer too short: {len(answer_text)} chars")

            # Recalculate word count rather than trusting model
            actual_wc = len(answer_text.split())
            return {"answer_text": answer_text, "word_count": actual_wc}

        except json.JSONDecodeError as e:
            time.sleep(2)
        except Exception as e:
            time.sleep(3)

    return None  # All retries failed


def process_question(item):
    """Worker function: generate answer for one question."""
    idx, total, q = item
    qid = q["id"]
    result = generate_answer(q["course_code"], q["question_text"], q["marks"], q["section"])
    return idx, total, qid, q["course_code"], q["section"], q["marks"], q["question_text"][:50], result


def main():
    raw_path = f"{DATA_DIR}/raw_questions.json"
    if not os.path.exists(raw_path):
        print(f"ERROR: {raw_path} not found. Run 01_extract_questions.py first.")
        return

    with open(raw_path) as f:
        questions = json.load(f)

    # Load progress
    progress = {}
    if os.path.exists(PROGRESS_PATH):
        with open(PROGRESS_PATH) as f:
            progress = json.load(f)

    failures = []
    total = len(questions)

    # Filter out already-done questions
    pending = [(i, total, q) for i, q in enumerate(questions) if q["id"] not in progress]

    print(f"Generating answers for {total} questions...")
    print(f"Already done: {total - len(pending)}")
    print(f"Pending: {len(pending)} (using {MAX_WORKERS} concurrent workers)")

    completed_count = total - len(pending)
    save_counter = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(process_question, item): item for item in pending}

        for future in as_completed(futures):
            idx, tot, qid, course, section, marks, text_preview, result = future.result()
            completed_count += 1

            if result:
                with _progress_lock:
                    progress[qid] = result
                print(f"  [{completed_count}/{total}] ✓ {course} {section}{marks}m: {text_preview}...")
            else:
                with _progress_lock:
                    progress[qid] = None
                failures.append({"id": qid, "course_code": course})
                print(f"  [{completed_count}/{total}] ✗ FAIL {course} {section}{marks}m: {text_preview}...")

            save_counter += 1
            if save_counter % 20 == 0:
                with _progress_lock:
                    snap = dict(progress)
                with open(PROGRESS_PATH, "w") as f:
                    json.dump(snap, f)

    # Final save of progress
    with open(PROGRESS_PATH, "w") as f:
        json.dump(progress, f)

    # Build final output — merge answers back into questions
    output = []
    for q in questions:
        qid = q["id"]
        answer_data = progress.get(qid)
        if answer_data:
            q["ai_answer"] = answer_data["answer_text"]
            q["ai_model_used"] = MODEL
            q["answer_status"] = "draft"
        else:
            q["ai_answer"] = None
            q["ai_model_used"] = None
            q["answer_status"] = "missing"
        output.append(q)

    out_path = f"{DATA_DIR}/questions_with_answers.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    failures_path = f"{DATA_DIR}/answer_failures.json"
    with open(failures_path, "w") as f:
        json.dump(failures, f, indent=2, ensure_ascii=False)

    answered = sum(1 for q in output if q["ai_answer"])
    print(f"\n── Answer generation complete ──")
    print(f"  Answered:  {answered}/{total}")
    print(f"  Failed:    {len(failures)} (see {failures_path})")
    print(f"  Output:    {out_path}")


if __name__ == "__main__":
    main()
