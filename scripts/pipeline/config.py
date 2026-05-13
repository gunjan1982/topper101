import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env.local'))

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com",
)
MODEL = "deepseek-chat"

LOCAL_BASE = os.path.expanduser(
    "~/Documents/2. COUNSELLING, THERAPY & COACHING/2. IGNOU M A C P/"
)

# All 16 theory courses
ALL_COURSES = [
    # Year 1
    {"code": "MPC-001", "name": "Cognitive Psychology, Learning and Memory",    "year": 1, "stream": "core"},
    {"code": "MPC-002", "name": "Life Span Psychology",                          "year": 1, "stream": "core"},
    {"code": "MPC-003", "name": "Personality: Theories and Assessment",          "year": 1, "stream": "core"},
    {"code": "MPC-004", "name": "Advanced Social Psychology",                    "year": 1, "stream": "core"},
    {"code": "MPC-005", "name": "Research Methods in Psychology",                "year": 1, "stream": "core"},
    {"code": "MPC-006", "name": "Statistics in Psychology",                      "year": 1, "stream": "core"},
    # Year 2 — Counselling
    {"code": "MPCE-021", "name": "Counselling Psychology",                       "year": 2, "stream": "counselling"},
    {"code": "MPCE-022", "name": "Assessment in Counselling and Guidance",       "year": 2, "stream": "counselling"},
    {"code": "MPCE-023", "name": "Interventions in Counselling",                 "year": 2, "stream": "counselling"},
    {"code": "MPCE-046", "name": "Applied Positive Psychology",                  "year": 2, "stream": "common"},
    # Year 2 — Clinical
    {"code": "MPCE-011", "name": "Abnormal Psychology",                          "year": 2, "stream": "clinical"},
    {"code": "MPCE-012", "name": "Psychodiagnostics",                            "year": 2, "stream": "clinical"},
    {"code": "MPCE-013", "name": "Psychotherapeutic Methods",                    "year": 2, "stream": "clinical"},
    # Year 2 — Organisational
    {"code": "MPCE-031", "name": "Organisational Behaviour",                     "year": 2, "stream": "organisational"},
    {"code": "MPCE-032", "name": "Human Resource Development",                   "year": 2, "stream": "organisational"},
    {"code": "MPCE-033", "name": "Organisational Development",                   "year": 2, "stream": "organisational"},
]

# Track A: have local merged Q paper PDFs and local textbooks
TRACK_A_CODES = [
    "MPC-001", "MPC-002", "MPC-003", "MPC-004", "MPC-005", "MPC-006",
    "MPCE-021", "MPCE-022", "MPCE-023", "MPCE-046",
]

# Track B: need to scrape Q papers from IGNOU portal + textbooks from eGyanKosh
TRACK_B_CODES = [
    "MPCE-011", "MPCE-012", "MPCE-013",
    "MPCE-031", "MPCE-032", "MPCE-033",
]

# Local Q paper merged PDFs (Track A)
# Note: IGNOU named the Year 2 Counselling files as MPC-021/022/023/046 (not MPCE-)
_Q_PAPER_FILENAME_MAP = {
    "MPC-001": "MPC-001", "MPC-002": "MPC-002", "MPC-003": "MPC-003",
    "MPC-004": "MPC-004", "MPC-005": "MPC-005", "MPC-006": "MPC-006",
    "MPCE-021": "MPC-021", "MPCE-022": "MPC-022", "MPCE-023": "MPC-023",
    "MPCE-046": "MPC-046",
}
LOCAL_Q_PAPER = {
    code: LOCAL_BASE + f"3 Past Exam Question Papers/QUESTION PAPERS_{_Q_PAPER_FILENAME_MAP[code]}_merged.pdf"
    for code in TRACK_A_CODES
}

# Local textbook PDFs (Track A)
LOCAL_TEXTBOOKS = {
    "MPC-001": LOCAL_BASE + "1st Year/MPC-001-Textbook-Cognitive Psychology, Learning and Memory.pdf",
    "MPC-002": LOCAL_BASE + "1st Year/MPC-002-Textbook-Life Span Psychology.pdf",
    "MPC-003": LOCAL_BASE + "1st Year/MPC-003-Textbook-Personality - Theories and Assessment.pdf",
    "MPC-004": LOCAL_BASE + "1st Year/MPC-004-Textbook-Advanced Social Psychology.pdf",
    "MPC-005": LOCAL_BASE + "1st Year/MPC-005-Textbook-Research Methods.pdf",
    "MPC-006": LOCAL_BASE + "1st Year/MPC-006-Textbook-Statistics in Psychology.pdf",
    "MPCE-021": LOCAL_BASE + "2nd Year/MPCE-021-Textbook-Counselling Psychology.pdf",
    "MPCE-022": LOCAL_BASE + "2nd Year/MPCE-022-Textbook-Assessment in Counselling and Guidance.pdf",
    "MPCE-023": LOCAL_BASE + "2nd Year/MPCE-023-Textbook-Interventions in Counseling.pdf",
    "MPCE-046": LOCAL_BASE + "2nd Year/MPCE-046-Textbook-Applied Positive Psychology.pdf",
}

# Target: 5 years = 10 TEE papers (June + December each year)
TARGET_YEARS = [2024, 2023, 2022, 2021, 2020]
TARGET_SESSIONS = ["June", "December"]

DATA_DIR = os.path.join(os.path.dirname(__file__), "../../data")
