import { COURSE_CATALOG } from './courseCatalog';
import rawSchedule from './examScheduleData.json';

export type ExamSession = 'Morning' | 'Evening';

export type ExamScheduleItem = {
  courseCode: string;
  date: string;
  session: ExamSession;
  startTime: string;
  endTime: string;
};

export const JUNE_2026_TEE_DATE_SHEET_URL =
  'https://www.ignou.ac.in/viewFile/SED/notification/Date-sheet-for-June-26-TEE-12-05-2026.pdf';

export const JUNE_2026_TEE_SOURCE_LABEL = 'IGNOU revised date sheet, 12 May 2026';

type RawScheduleItem = {
  courseCode: string;
  date: string;
  session: string;
  startTime: string;
  endTime: string;
};

export const JUNE_2026_TEE_SCHEDULE: ExamScheduleItem[] = (rawSchedule as RawScheduleItem[]).map(item => ({
  courseCode: item.courseCode,
  date: item.date,
  session: item.session as ExamSession,
  startTime: item.startTime,
  endTime: item.endTime
}));

// Helper to normalize course codes (e.g., MPC-001 -> MPC001, MPC_NEW -> MPCNEW)
export function normalizeCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

// Build map for fast O(1) lookups
const SCHEDULE_MAP = new Map<string, ExamScheduleItem>();
JUNE_2026_TEE_SCHEDULE.forEach(item => {
  SCHEDULE_MAP.set(normalizeCode(item.courseCode), item);
});

const formatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  timeZone: 'Asia/Kolkata',
});

function dateInIndia(date: string) {
  return new Date(`${date}T00:00:00+05:30`);
}

export function getExamSchedule(courseCode: string) {
  return SCHEDULE_MAP.get(normalizeCode(courseCode));
}

export function formatExamDate(date: string) {
  return formatter.format(dateInIndia(date));
}

export function formatExamWeekday(date: string) {
  return weekdayFormatter.format(dateInIndia(date));
}

export function daysUntilExam(date: string, now = new Date()) {
  return Math.ceil((dateInIndia(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function sortedExamSchedule(courseCodes: readonly string[] = JUNE_2026_TEE_SCHEDULE.map((item) => item.courseCode)) {
  const allowed = new Set(courseCodes.map(normalizeCode));
  return JUNE_2026_TEE_SCHEDULE
    .filter((item) => allowed.has(normalizeCode(item.courseCode)))
    .sort((a, b) => dateInIndia(a.date).getTime() - dateInIndia(b.date).getTime());
}

export function nextScheduledExam(courseCodes: readonly string[], now = new Date()) {
  return sortedExamSchedule(courseCodes).find((item) => daysUntilExam(item.date, now) >= 0);
}

export function scheduleWithCourseDetails(courseCodes?: readonly string[]) {
  return sortedExamSchedule(courseCodes).map((item) => ({
    ...item,
    course: COURSE_CATALOG.find((course) => normalizeCode(course.code) === normalizeCode(item.courseCode)),
  }));
}

