import pdfplumber
import re
import json
import os

pdf_path = "scratch/date_sheet.pdf"
output_path = "src/lib/examScheduleData.json"

if not os.path.exists(pdf_path):
    raise FileNotFoundError(f"Source PDF file not found at: {pdf_path}")

date_pattern = re.compile(r"(\d{2})\.(\d{2})\.(\d{4})")

course_schedules = []

print(f"Opening PDF: {pdf_path}")
with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    for page_idx in range(4, len(pdf.pages)):  # Pages 5 to 12
        page = pdf.pages[page_idx]
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                if len(row) != 3:
                    continue
                date_cell = row[0] or ""
                match = date_pattern.search(date_cell)
                if not match:
                    continue
                
                raw_date = match.group(0)
                # Convert DD.MM.YYYY to YYYY-MM-DD
                dd, mm, yyyy = raw_date.split(".")
                formatted_date = f"{yyyy}-{mm}-{dd}"
                
                # Extract day of week (e.g. MON, TUE, etc.)
                day_part = date_cell.replace(raw_date, "").strip().replace("\n", " ")
                
                morning_text = row[1] or ""
                evening_text = row[2] or ""
                
                # Split by whitespace, '/' or newlines and clean asterisks/formatting
                morning_codes = [c.strip().rstrip("*") for c in re.split(r"[\s/]+", morning_text) if c.strip()]
                evening_codes = [c.strip().rstrip("*") for c in re.split(r"[\s/]+", evening_text) if c.strip()]
                
                # Add morning exams
                for code in morning_codes:
                    if code:
                        course_schedules.append({
                            "courseCode": code,
                            "date": formatted_date,
                            "day": day_part,
                            "session": "Morning",
                            "startTime": "10:00 AM",
                            "endTime": "1:00 PM"
                        })
                
                # Add evening exams
                for code in evening_codes:
                    if code:
                        course_schedules.append({
                            "courseCode": code,
                            "date": formatted_date,
                            "day": day_part,
                            "session": "Evening",
                            "startTime": "2:00 PM",
                            "endTime": "5:00 PM"
                        })

# Ensure the output directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# Save JSON file
with open(output_path, "w") as f:
    json.dump(course_schedules, f, indent=2)

print(f"Extraction complete!")
print(f"Total entries: {len(course_schedules)}")
print(f"Total unique course codes: {len(set(item['courseCode'] for item in course_schedules))}")
print(f"Saved results to: {output_path}")
