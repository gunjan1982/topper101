#!/usr/bin/env bash
# run_all.sh — run the full content pipeline end-to-end
# Usage: ./run_all.sh
# Safe to re-run — each step checks for existing output before processing.

set -e
cd "$(dirname "$0")"
source venv/bin/activate

echo "=============================="
echo " Topper101 Content Pipeline"
echo "=============================="

echo ""
echo "[Step 0b] Download sources (copy Track A, scrape Track B)..."
python3 00b_download_sources.py

echo ""
echo "[Step 1]  Extract questions from PDFs..."
python3 01_extract_questions.py

echo ""
echo "[Step 2]  Cluster questions by topic..."
python3 02_cluster_topics.py

echo ""
echo "[Step 3]  Calculate frequency scores..."
python3 03_calculate_frequency.py

echo ""
echo "[Step 4]  Generate AI answers (DeepSeek)..."
python3 04_generate_answers.py

echo ""
echo "[Step 5]  Seed database..."
python3 05_seed_database.py

echo ""
echo "=============================="
echo " Pipeline complete!"
echo " Check data/download_report.json for any manual actions needed."
echo "=============================="
