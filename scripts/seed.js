const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const courses = [
  // Year 1 — theory courses (have TEE + assignments)
  { code: 'MPC-001', name: 'Cognitive Psychology, Learning and Memory', year: 1, stream: null, course_type: 'theory' },
  { code: 'MPC-002', name: 'Life Span Psychology', year: 1, stream: null, course_type: 'theory' },
  { code: 'MPC-003', name: 'Personality: Theories and Assessment', year: 1, stream: null, course_type: 'theory' },
  { code: 'MPC-004', name: 'Advanced Social Psychology', year: 1, stream: null, course_type: 'theory' },
  { code: 'MPC-005', name: 'Research Methods in Psychology', year: 1, stream: null, course_type: 'theory' },
  { code: 'MPC-006', name: 'Statistics in Psychology', year: 1, stream: null, course_type: 'theory' },
  // Year 1 — practical (viva-based, no standard TEE Q papers)
  { code: 'MPCL-007', name: 'Practicum in Experimental Psychology and Psychological Testing', year: 1, stream: null, course_type: 'practical' },
  // Year 2 — Clinical stream theory
  { code: 'MPCE-011', name: 'Abnormal Psychology', year: 2, stream: 'Clinical', course_type: 'theory' },
  { code: 'MPCE-012', name: 'Psychodiagnostics', year: 2, stream: 'Clinical', course_type: 'theory' },
  { code: 'MPCE-013', name: 'Psychotherapeutic Methods', year: 2, stream: 'Clinical', course_type: 'theory' },
  { code: 'MPCE-014', name: 'Practicum in Clinical Psychology', year: 2, stream: 'Clinical', course_type: 'practical' },
  { code: 'MPCE-015', name: 'Internship in Clinical Psychology', year: 2, stream: 'Clinical', course_type: 'internship' },
  { code: 'MPCE-016', name: 'Project in Clinical Psychology', year: 2, stream: 'Clinical', course_type: 'project' },
  // Year 2 — Counselling stream theory
  { code: 'MPCE-021', name: 'Counselling Psychology', year: 2, stream: 'Counselling', course_type: 'theory' },
  { code: 'MPCE-022', name: 'Assessment in Counselling and Guidance', year: 2, stream: 'Counselling', course_type: 'theory' },
  { code: 'MPCE-023', name: 'Interventions in Counselling', year: 2, stream: 'Counselling', course_type: 'theory' },
  { code: 'MPCE-024', name: 'Practicum in Counselling Psychology', year: 2, stream: 'Counselling', course_type: 'practical' },
  { code: 'MPCE-025', name: 'Internship in Counselling Psychology', year: 2, stream: 'Counselling', course_type: 'internship' },
  { code: 'MPCE-026', name: 'Project in Counselling Psychology', year: 2, stream: 'Counselling', course_type: 'project' },
  // Year 2 — Organisational stream theory
  { code: 'MPCE-031', name: 'Organisational Behaviour', year: 2, stream: 'Organisational', course_type: 'theory' },
  { code: 'MPCE-032', name: 'Human Resource Development', year: 2, stream: 'Organisational', course_type: 'theory' },
  { code: 'MPCE-033', name: 'Organisational Development', year: 2, stream: 'Organisational', course_type: 'theory' },
  { code: 'MPCE-034', name: 'Practicum in Organisational Behaviour', year: 2, stream: 'Organisational', course_type: 'practical' },
  { code: 'MPCE-035', name: 'Internship in Industrial/Organisational Psychology', year: 2, stream: 'Organisational', course_type: 'internship' },
  { code: 'MPCE-036', name: 'Project in Organisational Psychology', year: 2, stream: 'Organisational', course_type: 'project' },
  // Year 2 — Optional elective (replaces project for all streams)
  { code: 'MPCE-046', name: 'Applied Positive Psychology', year: 2, stream: null, course_type: 'theory' },
];

async function seed() {
  console.log('Seeding courses...');
  const { error } = await supabase.from('courses').upsert(courses, { onConflict: 'code' });
  if (error) {
    console.error('Error seeding courses:', error);
  } else {
    console.log('Courses seeded successfully!');
  }
}

seed();
