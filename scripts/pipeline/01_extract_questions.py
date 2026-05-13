"""
Step 1 — Extract questions from past paper PDFs.

Input:  data/past_papers/[course_code]/*.pdf
Output: data/raw_questions.json

IGNOU MAPC paper format:
  Section A: 2 questions × 10 marks (long answer)
  Section B: 4 questions × 6 marks  (medium answer)
  Section C: 2 questions × 3 marks  (short answer)

For Track A (merged PDFs), all years/sessions are in one PDF.
For Track B (scraped), each file is one paper named [CODE]_[Session]_[Year].pdf.
"""

import os
import json
import re
from pathlib import Path

import pdfplumber

from config import ALL_COURSES, TRACK_A_CODES, DATA_DIR

SECTION_MARKS = {"A": 10, "B": 6, "C": 3}

# Patterns for detecting page/paper headers in merged PDFs
YEAR_SESSION_PATTERN = re.compile(
    r'(june|december|dec|jun)[^\d]*(\d{4})', re.IGNORECASE
)
# Section header patterns
# Handles: "SECTION A", "Section A", "Section—A", "Section-A", "SECTION–A"
SECTION_HEADER = re.compile(r'^\s*section\s*[—\-–]?\s*([ABC])\b', re.IGNORECASE)
QUESTION_START = re.compile(r'^\s*(?:q\.?\s*)?(\d+)[.)]\s+(.+)', re.IGNORECASE | re.DOTALL)
MARKS_INLINE = re.compile(r'\((\d+)\s*(?:marks?|marks)\)', re.IGNORECASE)


def extract_from_pdf(pdf_path: str, course_code: str, forced_year: int = None,
                     forced_session: str = None) -> list[dict]:
    """
    Extract all questions from a PDF. Returns list of question dicts.
    Handles both merged (multi-paper) and single-paper PDFs.
    """
    questions = []
    current_year = forced_year
    current_session = forced_session
    current_section = None
    current_q_text = []
    current_q_num = None
    question_counter = 0

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                lines = text.split("\n")

                for line in lines:
                    stripped = line.strip()
                    if not stripped:
                        continue

                    # Detect year/session in merged PDFs
                    if forced_year is None:
                        m = YEAR_SESSION_PATTERN.search(stripped)
                        if m:
                            raw_session = m.group(1).lower()
                            new_session = "June" if raw_session in ("june", "jun") else "December"
                            new_year = int(m.group(2))
                            if new_year != current_year or new_session != current_session:
                                # Flush current question before resetting
                                if current_q_text and current_year and current_section:
                                    q = _flush_question(
                                        current_q_text, current_q_num, current_section,
                                        current_year, current_session, course_code
                                    )
                                    if q:
                                        questions.append(q)
                                current_q_text = []
                                current_q_num = None
                                current_year = new_year
                                current_session = new_session
                                current_section = None
                                question_counter = 0
                            continue

                    # Detect section header
                    sm = SECTION_HEADER.match(stripped)
                    if sm:
                        if current_q_text and current_year and current_section:
                            q = _flush_question(
                                current_q_text, current_q_num, current_section,
                                current_year, current_session, course_code
                            )
                            if q:
                                questions.append(q)
                        current_section = sm.group(1).upper()
                        current_q_text = []
                        current_q_num = None
                        question_counter = 0
                        continue

                    if not current_section:
                        continue

                    # Detect question start
                    qm = QUESTION_START.match(stripped)
                    if qm:
                        # Flush previous question
                        if current_q_text:
                            q = _flush_question(
                                current_q_text, current_q_num, current_section,
                                current_year, current_session, course_code
                            )
                            if q:
                                questions.append(q)
                        question_counter += 1
                        current_q_num = int(qm.group(1))
                        current_q_text = [qm.group(2).strip()]
                    elif current_q_text:
                        current_q_text.append(stripped)

                # End of page: don't flush — question may continue on next page

        # Flush last question
        if current_q_text and current_year and current_section:
            q = _flush_question(
                current_q_text, current_q_num, current_section,
                current_year, current_session, course_code
            )
            if q:
                questions.append(q)

    except Exception as e:
        print(f"  [ERR]  Failed to read {pdf_path}: {e}")

    return questions


def _flush_question(text_lines: list, q_num: int, section: str,
                    year: int, session: str, course_code: str) -> dict | None:
    """Assemble and clean a question from accumulated lines."""
    full_text = " ".join(text_lines).strip()
    full_text = re.sub(r'\s+', ' ', full_text)

    # Strip trailing marks annotation if present
    marks_match = MARKS_INLINE.search(full_text)
    marks = SECTION_MARKS.get(section, 10)
    if marks_match:
        marks = int(marks_match.group(1))
        full_text = full_text[:marks_match.start()].strip()

    # Skip if too short or looks like an instruction line
    if len(full_text) < 15:
        return None
    skip_patterns = [
        r'^(answer|attempt|all questions|note:|instructions)',
        r'^(this question paper|maximum marks|time)',
    ]
    for pat in skip_patterns:
        if re.match(pat, full_text, re.IGNORECASE):
            return None

    if not year or not session:
        return None

    q_id = f"{course_code.lower().replace('-', '')}-{year}-{session.lower()[:3]}-{section.lower()}-{q_num or 'x'}"

    return {
        "id": q_id,
        "course_code": course_code,
        "year": year,
        "session": session,
        "section": section,
        "marks": marks,
        "question_text": full_text,
        "ai_answer": None,
        "answer_source": None,
    }


def deduplicate(questions: list[dict]) -> list[dict]:
    """
    Remove near-duplicate questions (same course + section + similar text).
    Keep the earliest occurrence.
    """
    seen = {}
    unique = []
    for q in questions:
        key = (q["course_code"], q["section"])
        # Normalise text for comparison
        norm = re.sub(r'\W+', ' ', q["question_text"].lower()).strip()
        norm_words = set(norm.split())
        duplicate = False
        for prev_norm, prev_words in seen.get(key, []):
            if len(norm_words) > 0 and len(prev_words) > 0:
                overlap = len(norm_words & prev_words) / max(len(norm_words), len(prev_words))
                if overlap > 0.85:
                    duplicate = True
                    break
        if not duplicate:
            seen.setdefault(key, []).append((norm, norm_words))
            unique.append(q)
    return unique


def main():
    all_questions = []
    issues = []

    for course in ALL_COURSES:
        code = course["code"]
        papers_dir = Path(f"{DATA_DIR}/past_papers/{code}")

        if not papers_dir.exists() or not any(papers_dir.glob("*.pdf")):
            msg = f"No PDFs found in {papers_dir} — skipping {code}"
            print(f"  [WARN] {msg}")
            issues.append({"course": code, "issue": msg})
            continue

        course_questions = []
        pdfs = sorted(papers_dir.glob("*.pdf"))
        print(f"\n{code}: processing {len(pdfs)} PDF(s)...")

        for pdf_path in pdfs:
            fname = pdf_path.stem  # e.g. MPC-001_merged or MPCE-011_June_2023

            if "_merged" in fname:
                # Track A: year/session detected from content
                qs = extract_from_pdf(str(pdf_path), code)
            else:
                # Track B: parse year/session from filename
                m = re.search(r'_(June|December)_(\d{4})$', fname, re.IGNORECASE)
                if m:
                    session = m.group(1).capitalize()
                    year = int(m.group(2))
                    qs = extract_from_pdf(str(pdf_path), code, year, session)
                else:
                    qs = extract_from_pdf(str(pdf_path), code)

            print(f"  {pdf_path.name}: {len(qs)} questions extracted")
            course_questions.extend(qs)

            # Flag suspicious extraction
            if len(qs) < 5:
                issues.append({
                    "course": code,
                    "file": pdf_path.name,
                    "issue": f"Only {len(qs)} questions extracted — PDF may be scanned/image-only or have unusual formatting",
                })

        # Deduplicate within course
        before = len(course_questions)
        course_questions = deduplicate(course_questions)
        after = len(course_questions)
        if before != after:
            print(f"  Deduplicated: {before} → {after} questions")

        all_questions.extend(course_questions)
        print(f"  Total for {code}: {after} unique questions")

    # Write outputs
    out_path = f"{DATA_DIR}/raw_questions.json"
    with open(out_path, "w") as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)

    issues_path = f"{DATA_DIR}/extraction_issues.json"
    with open(issues_path, "w") as f:
        json.dump(issues, f, indent=2)

    print(f"\n── Extraction complete ──")
    print(f"  Total questions: {len(all_questions)}")
    print(f"  Issues flagged:  {len(issues)} (see {issues_path})")
    print(f"  Output:          {out_path}")

    # Summary by course
    from collections import Counter
    by_course = Counter(q["course_code"] for q in all_questions)
    for code, count in sorted(by_course.items()):
        print(f"    {code}: {count}")


if __name__ == "__main__":
    main()
