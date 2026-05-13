"""
Step 0b — Collect past papers and textbooks for all 16 theory courses.

Track A (10 courses): copy from Gunjan's local folder.
Track B (6 courses): scrape Q papers from IGNOU portal using Playwright.
All courses: download textbooks from eGyanKosh using Playwright.

Outputs:
  data/past_papers/[course_code]/[course_code]_[Session]_[Year].pdf  (Track B)
  data/past_papers/[course_code]/[course_code]_merged.pdf             (Track A — copied)
  data/textbooks/[course_code]/[filename].pdf
  data/download_report.json
"""

import os
import json
import shutil
import asyncio
import re
import time
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

from config import (
    LOCAL_Q_PAPER, LOCAL_TEXTBOOKS,
    TRACK_A_CODES, TRACK_B_CODES, ALL_COURSES,
    TARGET_YEARS, TARGET_SESSIONS, DATA_DIR,
)

# ── eGyanKosh handles for Track B course textbooks ───────────────────────────
# These are the confirmed DSpace handles for MPCE course material blocks.
# Handle 123456789/4448 is the MAPC programme root.
EGYANKOSH_COURSE_HANDLES = {
    "MPCE-011": "123456789/4477",   # Abnormal Psychology
    "MPCE-012": "123456789/4478",   # Psychodiagnostics
    "MPCE-013": "123456789/4479",   # Psychotherapeutic Methods
    "MPCE-031": "123456789/4480",   # Organisational Behaviour
    "MPCE-032": "123456789/4481",   # Human Resource Development
    "MPCE-033": "123456789/4482",   # Organisational Development
}
EGYANKOSH_BASE = "https://egyankosh.ac.in"
IGNOU_PREQUESTION_URL = "https://webservices.ignou.ac.in/Pre-Question/"


def ensure_dirs():
    for code in [c["code"] for c in ALL_COURSES]:
        Path(f"{DATA_DIR}/past_papers/{code}").mkdir(parents=True, exist_ok=True)
        Path(f"{DATA_DIR}/textbooks/{code}").mkdir(parents=True, exist_ok=True)
    Path(f"{DATA_DIR}/assignments").mkdir(parents=True, exist_ok=True)


report = {
    "question_papers": {},
    "textbooks": {},
    "total_papers_copied": 0,
    "total_papers_scraped": 0,
    "total_textbooks_copied": 0,
    "total_textbooks_downloaded": 0,
    "manual_action_required": [],
}

for code in [c["code"] for c in ALL_COURSES]:
    report["question_papers"][code] = {"found": [], "missing": [], "errors": []}
    report["textbooks"][code] = {"found": [], "missing": [], "errors": []}


# ── Track A: copy from local ─────────────────────────────────────────────────

def copy_track_a():
    print("\n── Track A: copying local Q papers and textbooks ──")
    for code in TRACK_A_CODES:
        # Q papers
        src = LOCAL_Q_PAPER[code]
        dest = f"{DATA_DIR}/past_papers/{code}/{code}_merged.pdf"
        if os.path.exists(dest):
            print(f"  [SKIP] {code} Q paper already at dest")
            report["question_papers"][code]["found"].append("merged (already present)")
        elif os.path.exists(src):
            shutil.copy2(src, dest)
            print(f"  [OK]   {code} Q paper copied")
            report["question_papers"][code]["found"].append("merged")
            report["total_papers_copied"] += 1
        else:
            msg = f"Local merged PDF not found: {src}"
            print(f"  [MISS] {code}: {msg}")
            report["question_papers"][code]["missing"].append(msg)
            report["manual_action_required"].append(
                f"{code} Q paper: {msg}"
            )

        # Textbooks
        tb_src = LOCAL_TEXTBOOKS.get(code)
        if not tb_src:
            continue
        tb_dest = f"{DATA_DIR}/textbooks/{code}/{os.path.basename(tb_src)}"
        if os.path.exists(tb_dest):
            print(f"  [SKIP] {code} textbook already at dest")
            report["textbooks"][code]["found"].append(os.path.basename(tb_src) + " (already present)")
        elif os.path.exists(tb_src):
            shutil.copy2(tb_src, tb_dest)
            print(f"  [OK]   {code} textbook copied")
            report["textbooks"][code]["found"].append(os.path.basename(tb_src))
            report["total_textbooks_copied"] += 1
        else:
            msg = f"Local textbook not found: {tb_src}"
            print(f"  [MISS] {code}: {msg}")
            report["textbooks"][code]["missing"].append(msg)
            report["manual_action_required"].append(f"{code} textbook: {msg}")


# ── Track B: scrape IGNOU pre-question portal ─────────────────────────────────

def _ignou_get_soss_url(index_url):
    """
    Fetch the IGNOU session index page and return the SOSS sub-page URL.
    The SOSS (Social Sciences) school hosts all MAPC papers.
    Returns None if SOSS link not found.
    """
    import requests as req
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    r = req.get(index_url, headers=headers, timeout=15)
    r.raise_for_status()
    soss_links = re.findall(r'href=["\']([^"\']*SOSS[^"\']*)["\']', r.text, re.IGNORECASE)
    if not soss_links:
        return None
    # Use the first SOSS link; strip anchors
    soss_rel = soss_links[0].split("#")[0]
    base = index_url.rsplit("/", 1)[0] + "/"
    if soss_rel.startswith("http"):
        return soss_rel
    return base + soss_rel


def _ignou_get_mapc_links(soss_url):
    """
    Fetch the SOSS page and return a dict of {code: pdf_url} for MAPC courses.
    """
    import requests as req
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    r = req.get(soss_url, headers=headers, timeout=15)
    r.raise_for_status()
    # Find MAPC sub-folder links: href="MAPC/MPCE-011.pdf"
    raw_links = re.findall(r'href=["\']([^"\']+)["\']', r.text, re.IGNORECASE)
    base = soss_url.rsplit("/", 1)[0] + "/"
    result = {}
    for link in raw_links:
        m = re.search(r'(MPC[E]?-\d+)\.pdf', link, re.IGNORECASE)
        if m:
            code = m.group(1).upper()
            url = link if link.startswith("http") else base + link
            result[code] = url
    return result


def _download_pdf(url, dest_path):
    """Download a PDF from url to dest_path using requests."""
    import requests as req
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
               "Referer": IGNOU_PREQUESTION_URL}
    r = req.get(url, headers=headers, timeout=30, stream=True)
    r.raise_for_status()
    ct = r.headers.get("Content-Type", "")
    if "html" in ct.lower():
        raise ValueError(f"Got HTML instead of PDF (Content-Type: {ct})")
    with open(dest_path, "wb") as f:
        for chunk in r.iter_content(65536):
            f.write(chunk)


# IGNOU portal session index pages (confirmed working)
# Sessions we want: June and December for 2020-2023 + June 2024
IGNOU_SESSION_INDEX_URLS = [
    ("June",     2020, "Question%20Paper%20June%202020/QP%20June%202020.htm"),
    ("December", 2020, "Question%20Paper%20December%202020/QPDecember2020.htm"),
    ("June",     2021, "Question%20Paper%20June%202021/QP%20June%202021.htm"),
    ("December", 2021, "Question%20Paper%20December%202021/QPDecember2021.htm"),
    ("June",     2022, "Question%20Paper%20June%202022/QP%20June%202022.htm"),
    ("December", 2022, "Question%20Paper%20December%202022/QPDecember2022.htm"),
    ("June",     2023, "Question%20Paper%20June%202023/QP%20June%202023.htm"),
    ("December", 2023, "Question%20Paper%20December%202023/QPDecember2023.htm"),
    ("June",     2024, "Question%20Paper%20June%202024/QP%20June%202024.htm"),
]


def scrape_track_b_papers():
    """
    IGNOU Pre-Question portal uses a static directory structure.
    Each session has an index HTM page → SOSS sub-page → PDF links per course.
    All MAPC courses (MPC-001–006, MPCE-011–033, MPCE-046) are under SOSS/MAPC/.
    """
    print("\n── Track B: scraping IGNOU Pre-Question portal ──")

    for session, year, rel_path in IGNOU_SESSION_INDEX_URLS:
        # Only download sessions in our target range
        if year not in TARGET_YEARS:
            continue

        index_url = IGNOU_PREQUESTION_URL + rel_path
        label = f"{session} {year}"
        try:
            soss_url = _ignou_get_soss_url(index_url)
            if not soss_url:
                print(f"  [WARN] {label}: SOSS link not found at {index_url}")
                continue
            code_links = _ignou_get_mapc_links(soss_url)
            if not code_links:
                print(f"  [WARN] {label}: no MAPC PDF links found at {soss_url}")
                continue
        except Exception as e:
            print(f"  [ERR]  {label}: failed to fetch index — {e}")
            continue

        for code in TRACK_B_CODES:
            pdf_url = code_links.get(code)
            if not pdf_url:
                report["question_papers"][code]["missing"].append(f"{session}_{year}")
                continue

            dest = f"{DATA_DIR}/past_papers/{code}/{code}_{session}_{year}.pdf"
            if os.path.exists(dest):
                print(f"  [SKIP] {code} {label} already downloaded")
                report["question_papers"][code]["found"].append(f"{session}_{year}")
                continue

            try:
                _download_pdf(pdf_url, dest)
                print(f"  [OK]   {code} {label}")
                report["question_papers"][code]["found"].append(f"{session}_{year}")
                report["total_papers_scraped"] += 1
            except Exception as e:
                err = str(e)[:120]
                print(f"  [ERR]  {code} {label}: {err}")
                report["question_papers"][code]["errors"].append(f"{session}_{year}: {err}")
                report["manual_action_required"].append(
                    f"{code} {session} {year}: download error ({err}) — add manually to data/past_papers/{code}/"
                )


async def _download_file(page, url, dest_path):
    """Download a file via requests (browser cookies not needed for eGyanKosh)."""
    _download_pdf(url, dest_path)


# ── eGyanKosh: download Track B textbooks ─────────────────────────────────────

async def download_egyankosh_textbooks(page):
    """
    Navigate eGyanKosh DSpace to find and download block PDFs for Track B courses.
    Starts from MAPC root handle and traverses to each course collection.
    """
    print("\n── eGyanKosh: downloading Track B textbooks ──")

    mapc_root = f"{EGYANKOSH_BASE}/handle/123456789/4448"
    try:
        await page.goto(mapc_root, wait_until="networkidle", timeout=30000)
        content = await page.content()
        with open(f"{DATA_DIR}/egyankosh_snapshot.html", "w") as f:
            f.write(content)
        print(f"  eGyanKosh root snapshot saved ({len(content)} bytes)")
    except PlaywrightTimeout:
        print("  [WARN] eGyanKosh root timed out — will try direct course handles")

    for code in TRACK_B_CODES:
        handle = EGYANKOSH_COURSE_HANDLES.get(code)
        if not handle:
            report["textbooks"][code]["errors"].append("No eGyanKosh handle configured")
            report["manual_action_required"].append(
                f"{code} textbook: no eGyanKosh handle configured — add manually to data/textbooks/{code}/"
            )
            continue

        course_url = f"{EGYANKOSH_BASE}/handle/{handle}"
        try:
            await page.goto(course_url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(1500)
            content = await page.content()

            # Find PDF download links
            pdf_links = await page.query_selector_all('a[href*=".pdf"], a[href*="bitstream"]')
            downloaded = 0
            for link in pdf_links:
                href = await link.get_attribute("href") or ""
                text = (await link.inner_text()).strip()
                if not href:
                    continue
                if not href.startswith("http"):
                    href = EGYANKOSH_BASE + href
                filename = re.sub(r'[^\w\-.]', '_', text or Path(href).name)[:80] + ".pdf"
                dest = f"{DATA_DIR}/textbooks/{code}/{filename}"
                if os.path.exists(dest):
                    continue
                try:
                    await _download_file(page, href, dest)
                    print(f"  [OK]   {code} textbook block: {filename}")
                    report["textbooks"][code]["found"].append(filename)
                    report["total_textbooks_downloaded"] += 1
                    downloaded += 1
                except Exception as e:
                    report["textbooks"][code]["errors"].append(f"{filename}: {str(e)[:80]}")

            if downloaded == 0:
                # Save page snapshot for manual inspection
                snap_path = f"{DATA_DIR}/egyankosh_{code}_snapshot.html"
                with open(snap_path, "w") as f:
                    f.write(content)
                msg = f"No PDFs found at {course_url} — snapshot saved for inspection"
                print(f"  [WARN] {code}: {msg}")
                report["textbooks"][code]["errors"].append(msg)
                report["manual_action_required"].append(
                    f"{code} textbook: {msg} — add PDFs manually to data/textbooks/{code}/"
                )

        except PlaywrightTimeout:
            msg = f"eGyanKosh handle {handle} timed out"
            print(f"  [ERR]  {code}: {msg}")
            report["textbooks"][code]["errors"].append(msg)
            report["manual_action_required"].append(
                f"{code} textbook: {msg} — add manually to data/textbooks/{code}/"
            )
        except Exception as e:
            msg = str(e)[:120]
            print(f"  [ERR]  {code}: {msg}")
            report["textbooks"][code]["errors"].append(msg)
            report["manual_action_required"].append(
                f"{code} textbook: error — add manually to data/textbooks/{code}/"
            )


# ── main ──────────────────────────────────────────────────────────────────────

async def main():
    ensure_dirs()
    copy_track_a()
    scrape_track_b_papers()  # synchronous, uses requests

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )
        page = await context.new_page()

        await download_egyankosh_textbooks(page)

        await browser.close()

    # Write report
    report_path = f"{DATA_DIR}/download_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n── Download report written to {report_path} ──")
    print(f"  Track A copied:       {report['total_papers_copied']} Q papers, {report['total_textbooks_copied']} textbooks")
    print(f"  Track B scraped:      {report['total_papers_scraped']} Q papers, {report['total_textbooks_downloaded']} textbooks")
    if report["manual_action_required"]:
        print(f"\n  ⚠  {len(report['manual_action_required'])} items need manual action:")
        for item in report["manual_action_required"]:
            print(f"     • {item}")


if __name__ == "__main__":
    asyncio.run(main())
