import fs from 'node:fs';
import { loadRepeatAlgorithm } from './lib/repeat-algorithm-loader.mjs';

const {
  cleanQuestionText,
  formatQuestionSession,
  questionRepeatKey,
  questionRepeatLabel,
} = loadRepeatAlgorithm();

const dataPath = process.argv[2] ?? 'data/questions_with_answers.json';
const minGroupSize = Number(process.argv[3] ?? 2);
const rows = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const groups = new Map();

rows.forEach((row) => {
  const courseCode = row.course_code ?? row.course ?? row.courseCode ?? row.course_id ?? 'UNKNOWN';
  const key = `${courseCode}::${questionRepeatKey(row)}`;
  const existing = groups.get(key) ?? [];
  existing.push(row);
  groups.set(key, existing);
});

const repeated = [...groups.entries()]
  .filter(([, items]) => items.length >= minGroupSize)
  .sort(([, a], [, b]) => b.length - a.length);

repeated.forEach(([key, items]) => {
  const [, repeatKey] = key.split('::');
  const courseCode = key.split('::')[0];
  console.log(`\n## ${courseCode} · ${questionRepeatLabel(repeatKey)} · ${items.length} variations`);
  items
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .forEach((item) => {
      console.log(`- ${formatQuestionSession(item.session, item.year)} · ${item.section ?? '?'} · ${item.marks ?? '?'}m · ${cleanQuestionText(item)}`);
    });
});

console.log(`\nFound ${repeated.length} repeat groups with at least ${minGroupSize} variations.`);
