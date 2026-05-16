import fs from 'node:fs';
import { loadRepeatAlgorithm } from './lib/repeat-algorithm-loader.mjs';

const {
  cleanQuestionText,
  formatQuestionSession,
  questionIntelligence,
} = loadRepeatAlgorithm();

function optionValue(args, name, fallback = null) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function courseCode(row) {
  return row.course_code ?? row.course ?? row.courseCode ?? row.course_id ?? 'UNKNOWN';
}

function sessionRank(row) {
  const sessionOrder = { December: 2, June: 1 };
  return (row.year ?? 0) * 10 + (sessionOrder[row.session] ?? 0);
}

function sessionKey(row) {
  return `${row.session ?? 'Unknown'}-${row.year ?? 'Unknown'}`;
}

function formatMeanMarks(value) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function sortedSessions(sessions) {
  return [...sessions.values()].sort((a, b) => b.rank - a.rank);
}

const args = process.argv.slice(2);
const explicitDataPath = args.find((arg, index) => !arg.startsWith('--') && !args[index - 1]?.startsWith('--'));
const dataPath = explicitDataPath ?? 'data/questions_with_answers.json';
const courseFilter = optionValue(args, '--course');
const minSessions = Number(optionValue(args, '--min-sessions', '2'));
const maxEvidence = Number(optionValue(args, '--max-evidence', '6'));
const rows = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const hooks = new Map();

rows
  .filter((row) => !courseFilter || courseCode(row) === courseFilter)
  .forEach((row) => {
    const code = courseCode(row);
    const intelligence = questionIntelligence({ ...row, course_code: code });
    const key = `${code}::${intelligence.studyHookKey}`;
    const group = hooks.get(key) ?? {
      courseCode: code,
      hookKey: intelligence.studyHookKey,
      hookLabel: intelligence.studyHookLabel,
      rows: [],
      sessions: new Map(),
      families: new Map(),
    };

    group.rows.push({ row, intelligence });

    if (row.year && row.session) {
      const key = sessionKey(row);
      const session = group.sessions.get(key) ?? {
        key,
        label: formatQuestionSession(row.session, row.year),
        rank: sessionRank(row),
        questionCount: 0,
        totalMarks: 0,
      };
      session.questionCount += 1;
      session.totalMarks += Number(row.marks ?? 0);
      group.sessions.set(key, session);
    }

    const family = group.families.get(intelligence.repeatFamilyKey) ?? {
      key: intelligence.repeatFamilyKey,
      label: intelligence.repeatFamilyLabel,
      rows: [],
      sessions: new Set(),
    };
    family.rows.push(row);
    if (row.year && row.session) family.sessions.add(sessionKey(row));
    group.families.set(intelligence.repeatFamilyKey, family);

    hooks.set(key, group);
  });

const auditedHooks = [...hooks.values()]
  .filter((group) => group.sessions.size >= minSessions)
  .sort((a, b) => (
    b.sessions.size - a.sessions.size ||
    b.rows.length - a.rows.length ||
    a.hookLabel.localeCompare(b.hookLabel)
  ));

console.log(`# Repeat Intelligence Audit`);
console.log(`Source: ${dataPath}`);
if (courseFilter) console.log(`Course: ${courseFilter}`);
console.log(`Minimum coverage: ${minSessions} TEEs\n`);

auditedHooks.forEach((group) => {
  const totalMarks = group.rows.reduce((sum, item) => sum + Number(item.row.marks ?? 0), 0);
  const meanMarks = group.rows.length > 0 ? totalMarks / group.rows.length : 0;
  const sessions = sortedSessions(group.sessions);
  const sessionSummary = sessions
    .slice(0, 10)
    .map((session) => {
      const mean = session.questionCount > 0 ? session.totalMarks / session.questionCount : 0;
      return `${session.label} ${formatMeanMarks(mean)}m avg`;
    })
    .join(' · ');
  const hiddenSessions = Math.max(0, sessions.length - 10);

  console.log(`## ${group.courseCode} · ${group.hookLabel}`);
  console.log(`${sessions.length} TEEs · ${group.rows.length} questions · ${formatMeanMarks(meanMarks)}m overall mean`);
  console.log(`Sessions: ${sessionSummary}${hiddenSessions ? ` · +${hiddenSessions} more` : ''}`);
  console.log('Repeat families:');

  [...group.families.values()]
    .sort((a, b) => (
      b.sessions.size - a.sessions.size ||
      b.rows.length - a.rows.length ||
      a.label.localeCompare(b.label)
    ))
    .slice(0, 8)
    .forEach((family) => {
      console.log(`- ${family.label}: ${family.sessions.size} TEEs · ${family.rows.length} variation${family.rows.length === 1 ? '' : 's'}`);
    });

  console.log('Evidence:');
  group.rows
    .sort((a, b) => sessionRank(b.row) - sessionRank(a.row) || Number(b.row.marks ?? 0) - Number(a.row.marks ?? 0))
    .slice(0, maxEvidence)
    .forEach(({ row, intelligence }) => {
      console.log(`- ${formatQuestionSession(row.session, row.year)} · ${row.section ?? '?'} · ${row.marks ?? '?'}m · ${intelligence.repeatFamilyLabel} · ${cleanQuestionText(row)}`);
    });
  console.log('');
});

console.log(`Audited ${auditedHooks.length} study hooks.`);
