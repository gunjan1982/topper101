#!/usr/bin/env python3
"""
Upload all local PDFs to Supabase Storage bucket 'pdfs'.

Mappings:
  data/past_papers/{course}/{file}.pdf  →  pdfs/past-papers/{course}/{file}.pdf
  data/past_papers_dec2025/{file}.pdf   →  pdfs/past-papers-dec2025/{file}.pdf
  data/textbooks/{course}/{file}.pdf    →  pdfs/textbooks/{course}/{file}.pdf
"""

import os
import sys
import glob
import time
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://gayauvhhgwbbqgrqajak.supabase.co")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET = "pdfs"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

HEADERS = {
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "apikey": SERVICE_ROLE_KEY,
}

def upload_file(local_path: str, bucket_path: str, retries: int = 3) -> bool:
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{bucket_path}"
    file_size = os.path.getsize(local_path)

    for attempt in range(1, retries + 1):
        try:
            with open(local_path, "rb") as f:
                resp = requests.post(
                    url,
                    headers={**HEADERS, "Content-Type": "application/pdf", "x-upsert": "true"},
                    data=f,
                    timeout=60,
                )
            if resp.status_code in (200, 201):
                return True
            # If already exists and upsert worked it returns 200; 409 means duplicate but upsert should handle it
            print(f"  [{resp.status_code}] {bucket_path}: {resp.text[:120]}")
            if resp.status_code >= 500 and attempt < retries:
                time.sleep(2 * attempt)
                continue
            return resp.status_code in (200, 201)
        except requests.RequestException as e:
            print(f"  Error attempt {attempt}: {e}")
            if attempt < retries:
                time.sleep(2 * attempt)
    return False


def collect_uploads():
    """Returns list of (local_path, bucket_path) tuples."""
    uploads = []

    # 1. Past papers (all years/sessions)
    pattern = os.path.join(DATA_DIR, "past_papers", "**", "*.pdf")
    for local in glob.glob(pattern, recursive=True):
        rel = os.path.relpath(local, os.path.join(DATA_DIR, "past_papers"))
        bucket_path = f"past-papers/{rel.replace(os.sep, '/')}"
        uploads.append((local, bucket_path))

    # 2. Dec 2025 question papers
    pattern = os.path.join(DATA_DIR, "past_papers_dec2025", "*.pdf")
    for local in glob.glob(pattern):
        fname = os.path.basename(local)
        bucket_path = f"past-papers-dec2025/{fname}"
        uploads.append((local, bucket_path))

    # 3. Textbook PDFs
    pattern = os.path.join(DATA_DIR, "textbooks", "**", "*.pdf")
    for local in glob.glob(pattern, recursive=True):
        rel = os.path.relpath(local, os.path.join(DATA_DIR, "textbooks"))
        bucket_path = f"textbooks/{rel.replace(os.sep, '/')}"
        uploads.append((local, bucket_path))

    return uploads


def main():
    uploads = collect_uploads()
    total = len(uploads)
    print(f"Found {total} PDFs to upload.\n")

    ok = 0
    fail = 0
    for i, (local_path, bucket_path) in enumerate(uploads, 1):
        size_mb = os.path.getsize(local_path) / 1_048_576
        print(f"[{i}/{total}] {bucket_path} ({size_mb:.1f} MB)", end=" ... ", flush=True)
        success = upload_file(local_path, bucket_path)
        if success:
            print("✓")
            ok += 1
        else:
            print("FAILED")
            fail += 1

    print(f"\n{'='*50}")
    print(f"Done: {ok} uploaded, {fail} failed out of {total} total.")
    if fail > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
