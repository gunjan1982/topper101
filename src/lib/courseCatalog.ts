export type CourseCatalogItem = {
  id: string;
  code: string;
  name: string;
  year: number;
  stream: string | null;
  course_type: "theory" | "practical" | "internship" | "project";
};

export const MAPC_STREAMS = [
  { id: "Counselling", name: "Counselling Psychology", icon: "🤝" },
  { id: "Clinical", name: "Clinical Psychology", icon: "🏥" },
  { id: "Organisational", name: "Organisational Psychology", icon: "🏢" },
] as const;

export type MapcStream = (typeof MAPC_STREAMS)[number]["id"];

export const COURSE_CATALOG: CourseCatalogItem[] = [
  { id: "catalog-mpc-001", code: "MPC-001", name: "Cognitive Psychology, Learning and Memory", year: 1, stream: null, course_type: "theory" },
  { id: "catalog-mpc-002", code: "MPC-002", name: "Life Span Psychology", year: 1, stream: null, course_type: "theory" },
  { id: "catalog-mpc-003", code: "MPC-003", name: "Personality: Theories and Assessment", year: 1, stream: null, course_type: "theory" },
  { id: "catalog-mpc-004", code: "MPC-004", name: "Advanced Social Psychology", year: 1, stream: null, course_type: "theory" },
  { id: "catalog-mpc-005", code: "MPC-005", name: "Research Methods in Psychology", year: 1, stream: null, course_type: "theory" },
  { id: "catalog-mpc-006", code: "MPC-006", name: "Statistics in Psychology", year: 1, stream: null, course_type: "theory" },
  { id: "catalog-mpce-011", code: "MPCE-011", name: "Abnormal Psychology", year: 2, stream: "Clinical", course_type: "theory" },
  { id: "catalog-mpce-012", code: "MPCE-012", name: "Psychodiagnostics", year: 2, stream: "Clinical", course_type: "theory" },
  { id: "catalog-mpce-013", code: "MPCE-013", name: "Psychotherapeutic Methods", year: 2, stream: "Clinical", course_type: "theory" },
  { id: "catalog-mpce-021", code: "MPCE-021", name: "Counselling Psychology", year: 2, stream: "Counselling", course_type: "theory" },
  { id: "catalog-mpce-022", code: "MPCE-022", name: "Assessment in Counselling and Guidance", year: 2, stream: "Counselling", course_type: "theory" },
  { id: "catalog-mpce-023", code: "MPCE-023", name: "Interventions in Counselling", year: 2, stream: "Counselling", course_type: "theory" },
  { id: "catalog-mpce-031", code: "MPCE-031", name: "Organisational Behaviour", year: 2, stream: "Organisational", course_type: "theory" },
  { id: "catalog-mpce-032", code: "MPCE-032", name: "Human Resource Development", year: 2, stream: "Organisational", course_type: "theory" },
  { id: "catalog-mpce-033", code: "MPCE-033", name: "Organisational Development", year: 2, stream: "Organisational", course_type: "theory" },
  { id: "catalog-mpce-046", code: "MPCE-046", name: "Applied Positive Psychology", year: 2, stream: "Common", course_type: "theory" },
];

export function normalizeStream(stream: string | null | undefined) {
  if (!stream) return null;
  const normalized = stream.trim().toLowerCase();
  if (normalized === "core") return null;
  if (normalized === "organizational") return "organisational";
  return normalized;
}

export function isTheoryCourse(course: Pick<CourseCatalogItem, "course_type" | "code">) {
  return course.course_type === "theory" && !course.code.startsWith("MPCL-");
}

export function matchesCourseSelection(
  course: Pick<CourseCatalogItem, "code" | "year" | "stream" | "course_type">,
  year: number,
  stream: string | null
) {
  if (course.year !== year || !isTheoryCourse(course)) return false;
  if (year === 1) return course.code.startsWith("MPC-") && normalizeStream(course.stream) === null;

  const courseStream = normalizeStream(course.stream);
  const selectedStream = normalizeStream(stream);
  return courseStream === selectedStream || courseStream === "common" || course.code === "MPCE-046";
}

export function selectableCourses<T extends CourseCatalogItem>(
  courses: T[] | null | undefined,
  year: number,
  stream: string | null
) {
  const source = courses && courses.length > 0 ? courses : (COURSE_CATALOG as T[]);
  return source
    .filter((course) => matchesCourseSelection(course, year, stream))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function courseByCode<T extends CourseCatalogItem>(
  courses: T[] | null | undefined,
  code: string
) {
  return (
    courses?.find((course) => course.code === code) ??
    (COURSE_CATALOG.find((course) => course.code === code) as T | undefined)
  );
}
