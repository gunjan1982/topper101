import { COURSE_CATALOG } from './courseCatalog';

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

export const JUNE_2026_TEE_SCHEDULE: ExamScheduleItem[] = [
  { courseCode: 'MPCE-011', date: '2026-06-15', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPCE-021', date: '2026-06-15', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPCE-031', date: '2026-06-15', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPCE-012', date: '2026-06-24', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPCE-022', date: '2026-06-24', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPCE-032', date: '2026-06-24', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPCE-013', date: '2026-06-25', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPCE-023', date: '2026-06-25', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPCE-033', date: '2026-06-25', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPCE-046', date: '2026-06-29', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPC-001', date: '2026-07-09', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPC-002', date: '2026-07-11', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPC-003', date: '2026-07-13', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPC-004', date: '2026-07-15', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPC-005', date: '2026-07-17', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
  { courseCode: 'MPC-006', date: '2026-07-20', session: 'Evening', startTime: '2:00 PM', endTime: '5:00 PM' },
];

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
  return JUNE_2026_TEE_SCHEDULE.find((item) => item.courseCode === courseCode);
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
  const allowed = new Set(courseCodes);
  return JUNE_2026_TEE_SCHEDULE
    .filter((item) => allowed.has(item.courseCode))
    .sort((a, b) => dateInIndia(a.date).getTime() - dateInIndia(b.date).getTime());
}

export function nextScheduledExam(courseCodes: readonly string[], now = new Date()) {
  return sortedExamSchedule(courseCodes).find((item) => daysUntilExam(item.date, now) >= 0);
}

export function scheduleWithCourseDetails(courseCodes?: readonly string[]) {
  return sortedExamSchedule(courseCodes).map((item) => ({
    ...item,
    course: COURSE_CATALOG.find((course) => course.code === item.courseCode),
  }));
}
