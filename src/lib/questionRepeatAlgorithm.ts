import { cleanQuestionText, normalizeQuestionText } from './questionDisplay';

export const QUESTION_INTELLIGENCE_ALGO_VERSION = 'repeat-intelligence-v1';

export type QuestionRepeatInput = {
  question_text: string;
  marks?: number | null;
  topic?: string | null;
  course_code?: string | null;
  courseCode?: string | null;
  course?: string | null;
};

type PatternRule = {
  key: string;
  label: string;
  courseCodes?: string[];
  all?: RegExp[];
  any?: RegExp[];
  none?: RegExp[];
  topicAll?: RegExp[];
  topicAny?: RegExp[];
  topicNone?: RegExp[];
};

type QuestionIntelligence = {
  repeatFamilyKey: string;
  repeatFamilyLabel: string;
  studyHookKey: string;
  studyHookLabel: string;
};

const repeatRules: PatternRule[] = [
  {
    key: 'concept:sternberg-triarchic-theory-of-intelligence',
    label: "Sternberg's triarchic theory of intelligence",
    all: [/\btriarchic\b/],
    any: [/\bsternberg\b/, /\bthree components\b/],
  },
  {
    key: 'concept:sternberg-information-processing-approach',
    label: "Sternberg's information-processing approach",
    all: [/\bsternberg\b|\bstemberg\b/, /\binformation processing\b/],
  },
  {
    key: 'concept:spearman-two-factor-theory',
    label: "Spearman's two-factor theory of intelligence",
    all: [/\bspearman\b/, /\btwo[-\s]*factor\b/],
  },
  {
    key: 'concept:alfred-binet-intelligence-testing',
    label: 'Alfred Binet and intelligence testing',
    all: [/\bbinet\b/],
    any: [/\bcontribution\b/, /\bmeasurement\b/, /\btesting\b/, /\bintelligence\b/, /\bquotient\b/, /\bi\s*\.?\s*q\b/],
  },
  {
    key: 'concept:guilford-structure-of-intellect',
    label: "Guilford's structure-of-intellect theory",
    all: [/\bguilford\b/],
    any: [/\bstructure\b/, /\bintellect\b/, /\bsoi\b/],
  },
  {
    key: 'concept:pass-theory-of-intelligence',
    label: 'PASS theory of intelligence',
    all: [/\bpass theory\b/],
  },
  {
    key: 'concept:gardner-theory-of-intelligence',
    label: "Gardner's theory of intelligence",
    all: [/\bgardner\b/, /\bintelligence\b/],
  },
  {
    key: 'concept:atkinson-shiffrin-memory-model',
    label: 'Atkinson-Shiffrin memory model',
    all: [/\batkinson\b/, /\bshiffrin\b/],
  },
  {
    key: 'concept:waugh-norman-primary-secondary-memory',
    label: "Waugh and Norman's primary and secondary memory model",
    all: [/\bwaugh\b/, /\bnorman\b/],
  },
  {
    key: 'concept:waugh-norman-primary-secondary-memory',
    label: "Waugh and Norman's primary and secondary memory model",
    all: [/\bprimary and secondary memory\b/],
  },
  {
    key: 'concept:bloom-taxonomy-cognitive-domain',
    label: "Bloom's taxonomy of cognitive domain",
    all: [/\bbloom\b/, /\btaxonomy\b/],
  },
  {
    key: 'concept:cognitive-psychology-domains',
    label: 'Domains and principal areas of cognitive psychology',
    all: [/\bcognitive psychology\b/],
    any: [/\bdomains?\b/, /\bprincipal areas?\b/, /\bareas? of research\b/],
  },
  {
    key: 'concept:neurocognitive-revolution-cognitive-psychology',
    label: 'Neurocognitive revolution in cognitive psychology',
    all: [/\bneurocognitive revolution\b/],
  },
  {
    key: 'concept:cognitive-psychology-foundations',
    label: 'Cognitive psychology foundations, history, and scope',
    all: [/\bcognitive psychology\b/],
    any: [/\bmeaning\b/, /\bhistory\b/, /\bhistorical\b/, /\bkey issues?\b/, /\bresearch methods?\b/],
  },
  {
    key: 'concept:aphasia-types-language-disorder',
    label: 'Aphasia and its types',
    all: [/\baphasia\b/],
  },
  {
    key: 'concept:levels-of-processing-craik-lockhart',
    label: 'Craik and Lockhart levels of processing',
    all: [/\blevels? of processing\b/],
    any: [/\bcraik\b/, /\blockhart\b/, /\bmemory\b/],
  },
  {
    key: 'concept:working-memory-baddeley-hitch',
    label: 'Working memory and Baddeley-Hitch model',
    all: [/\bworking memory\b/],
    any: [/\bbaddeley\b/, /\bhitch\b/, /\binformation processing\b/, /\bmodel\b/],
  },
  {
    key: 'concept:sensory-short-term-long-term-memory',
    label: 'Sensory, short-term, and long-term memory',
    any: [
      /\bsensory memory\b.*\bshort(?:-| )term memory\b.*\blong(?:-| )term memory\b/,
      /\bshort(?:-| )term\b.*\blong(?:-| )term\b.*\bmemory\b/,
      /\bdifference between short(?:-| )term and long(?:-| )term memory\b/,
    ],
  },
  {
    key: 'concept:cellular-biological-bases-memory-learning',
    label: 'Biological bases of memory and learning',
    any: [
      /\bcellular bases\b.*\blearning\b.*\bmemory\b/,
      /\bbiological bases\b.*\bmemory\b.*\blearning\b/,
      /\bmemory\b.*\bbrain\b/,
      /\bbrain\b.*\bmemory\b/,
      /\bmemory consolidation\b/,
      /\bmemory consolidation\b.*\bhippocampus\b/,
      /\bhippocampus\b.*\bmemory\b/,
    ],
  },
  {
    key: 'concept:problem-solving-blocks',
    label: 'Blocks to problem solving',
    all: [/\bblocks?\b/, /\bproblem solving\b/],
  },
  {
    key: 'concept:problem-solving-gestalt-approach',
    label: 'Gestalt approach to problem solving',
    all: [/\bgestalt\b/, /\bproblem solving\b/],
  },
  {
    key: 'concept:problem-solving-well-defined-ill-defined',
    label: 'Well-defined and ill-defined problems',
    all: [/\bwell[-\s]*defined\b/, /\bill[-\s]*defined\b/],
  },
  {
    key: 'concept:problem-solving-strategies-stages-factors',
    label: 'Problem-solving strategies, stages, techniques, and factors',
    all: [/\bproblem solving\b/],
    any: [/\bstrategies\b/, /\bstages\b/, /\bfactors\b/, /\btechniques\b/, /\btypolog(?:y|ies)\b/, /\btypes? of problems\b/],
  },
  {
    key: 'concept:creativity-investment-confluence-theory',
    label: 'Investment and confluence theory of creativity',
    all: [/\bcreativity\b/],
    any: [/\binvestment\b/, /\bconfluence\b/],
  },
  {
    key: 'concept:creativity-and-intelligence',
    label: 'Creativity and intelligence',
    all: [/\bcreativity\b/, /\bintelligence\b/],
  },
  {
    key: 'concept:creativity-meaning-aspects-stages',
    label: 'Meaning, aspects, stages, and measurement of creativity',
    any: [
      /\bcreativity\b.*\b(meaning|aspects|stages|measurement|theory|process)\b/,
      /\b(meaning|aspects|stages|measurement|theory|process)\b.*\bcreativity\b/,
      /\bcreative discoveries\b/,
    ],
  },
  {
    key: 'concept:speech-disorders',
    label: 'Speech disorders',
    all: [/\bspeech disorders?\b/],
  },
  {
    key: 'concept:information-processing-principles',
    label: 'Principles and theories of information processing',
    all: [/\binformation processing\b/],
    any: [/\bprinciples?\b/, /\bprocess\b/, /\btheories\b/, /\blearning and memory\b/],
  },
  {
    key: 'concept:language-acquisition-theories',
    label: 'Language acquisition theories',
    any: [/\blanguage acquisition\b/, /\binnateness theory\b/, /\bchomsky\b/, /\bbehaviou?ristic theory\b/, /\bpiaget\b.*\blanguage\b/],
  },
];

const studyHookRules: PatternRule[] = [
  {
    key: 'study-hook:mpc-001:biological-bases-memory-learning',
    label: 'Biological bases of memory and learning',
    courseCodes: ['MPC-001'],
    topicAny: [/\bbiological bases\b/],
    any: [/\bcellular bases\b/, /\bhippocampus\b/, /\bmemory consolidation\b/, /\bmemory\b.*\bbrain\b/, /\bbrain\b.*\bmemory\b/],
  },
  {
    key: 'study-hook:mpc-001:memory-models-and-systems',
    label: 'Memory models and systems',
    courseCodes: ['MPC-001'],
    topicAny: [/\bmemory models?\b/],
    any: [
      /\batkinson\b/,
      /\bshiffrin\b/,
      /\bwaugh\b/,
      /\bnorman\b/,
      /\bworking memory\b/,
      /\bbaddeley\b/,
      /\bhitch\b/,
      /\blevels? of processing\b/,
      /\bcraik\b/,
      /\blockhart\b/,
      /\bsensory memory\b/,
      /\bshort[-\s]*term memory\b/,
      /\blong[-\s]*term memory\b/,
      /\bmodels? of memory\b/,
      /\bprimary and secondary memory\b/,
    ],
  },
  {
    key: 'study-hook:mpc-001:information-processing-models',
    label: 'Information processing models',
    courseCodes: ['MPC-001'],
    topicAny: [/\binformation processing\b/],
    any: [/\binformation processing\b/],
  },
  {
    key: 'study-hook:mpc-001:creativity-theories-stages',
    label: 'Creativity theories, stages, and intelligence links',
    courseCodes: ['MPC-001'],
    topicAny: [/\bcreativity\b/],
    any: [/\bcreativity\b/, /\bcreative discoveries\b/],
  },
  {
    key: 'study-hook:mpc-001:intelligence-theories',
    label: 'Intelligence theories and testing',
    courseCodes: ['MPC-001'],
    topicAny: [/\bintelligence theories\b/],
    any: [
      /\bintelligence\b/,
      /\bsternberg\b/,
      /\bstemberg\b/,
      /\bspearman\b/,
      /\bbinet\b/,
      /\bguilford\b/,
      /\bpass theory\b/,
      /\bgardner\b/,
      /\bi\s*\.?\s*q\b/,
    ],
  },
  {
    key: 'study-hook:mpc-001:problem-solving',
    label: 'Problem solving approaches and blocks',
    courseCodes: ['MPC-001'],
    topicAny: [/\bproblem solving\b/, /\bblocks to problem\b/],
    any: [/\bproblem solving\b/, /\bwell[-\s]*defined\b/, /\bill[-\s]*defined\b/, /\bgestalt\b/, /\bnewell\b/],
  },
  {
    key: 'study-hook:mpc-001:cognitive-psychology-foundations',
    label: 'Cognitive psychology foundations, scope, and research',
    courseCodes: ['MPC-001'],
    topicAny: [/\bcognitive psychology foundations\b/],
    any: [/\bcognitive psychology\b/, /\bneurocognitive revolution\b/, /\bbloom\b/, /\btaxonomy\b.*\bcognitive domain\b/],
  },
  {
    key: 'study-hook:mpc-001:language-acquisition-processing',
    label: 'Language acquisition and processing',
    courseCodes: ['MPC-001'],
    topicAny: [/\blanguage acquisition\b/],
    any: [/\blanguage acquisition\b/, /\bbuilding blocks of language\b/, /\binnateness theory\b/, /\bchomsky\b/, /\bbehaviou?ristic theory\b/],
  },
  {
    key: 'study-hook:mpc-001:language-disorders-speech',
    label: 'Language disorders and speech',
    courseCodes: ['MPC-001'],
    topicAny: [/\blanguage disorders\b/, /\bspeech\b/],
    any: [/\baphasia\b/, /\bspeech disorders?\b/, /\blanguage disorder\b/],
  },
];

function questionCourseCode(question: QuestionRepeatInput) {
  return (question.course_code ?? question.courseCode ?? question.course ?? '').toUpperCase();
}

function normalizePatternText(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function ruleMatches(rule: PatternRule, text: string, question: QuestionRepeatInput) {
  const courseCode = questionCourseCode(question);
  const topic = normalizePatternText(question.topic);
  const textAnyMatches = rule.any?.some((pattern) => pattern.test(text)) ?? false;
  const topicAnyMatches = rule.topicAny?.some((pattern) => pattern.test(topic)) ?? false;

  if (rule.courseCodes && !rule.courseCodes.includes(courseCode)) return false;
  if (rule.none?.some((pattern) => pattern.test(text))) return false;
  if (rule.all && !rule.all.every((pattern) => pattern.test(text))) return false;
  if (rule.topicNone?.some((pattern) => pattern.test(topic))) return false;
  if (rule.topicAll && !rule.topicAll.every((pattern) => pattern.test(topic))) return false;
  if ((rule.any || rule.topicAny) && !(textAnyMatches || topicAnyMatches)) return false;
  return Boolean(rule.all || rule.any || rule.topicAll || rule.topicAny);
}

export function questionRepeatKey(question: QuestionRepeatInput) {
  const cleaned = cleanQuestionText(question).toLowerCase();

  for (const rule of repeatRules) {
    if (ruleMatches(rule, cleaned, question)) return rule.key;
  }

  return normalizeQuestionText(question);
}

export function questionRepeatLabel(key: string) {
  return repeatRules.find((rule) => rule.key === key)?.label ?? key.replace(/^concept:/, '').replace(/-/g, ' ');
}

export function matchedRepeatRule(question: QuestionRepeatInput) {
  const key = questionRepeatKey(question);
  return repeatRules.find((rule) => rule.key === key) ?? null;
}

export function questionStudyHookKey(question: QuestionRepeatInput) {
  const cleaned = cleanQuestionText(question).toLowerCase();

  for (const rule of studyHookRules) {
    if (ruleMatches(rule, cleaned, question)) return rule.key;
  }

  if (question.topic) {
    const coursePrefix = questionCourseCode(question) ? `${questionCourseCode(question).toLowerCase()}:` : '';
    return `study-hook:${coursePrefix}${slugify(question.topic)}`;
  }

  return `study-hook:${questionRepeatKey(question)}`;
}

export function questionStudyHookLabel(key: string) {
  const matched = studyHookRules.find((rule) => rule.key === key);
  if (matched) return matched.label;

  return key
    .replace(/^study-hook:/, '')
    .replace(/^concept:/, '')
    .replace(/^[a-z0-9-]+:/, '')
    .replace(/-/g, ' ');
}

export function matchedStudyHookRule(question: QuestionRepeatInput) {
  const key = questionStudyHookKey(question);
  return studyHookRules.find((rule) => rule.key === key) ?? null;
}

export function questionIntelligence(question: QuestionRepeatInput): QuestionIntelligence {
  const repeatFamilyKey = questionRepeatKey(question);
  const studyHookKey = questionStudyHookKey(question);

  return {
    repeatFamilyKey,
    repeatFamilyLabel: questionRepeatLabel(repeatFamilyKey),
    studyHookKey,
    studyHookLabel: questionStudyHookLabel(studyHookKey),
  };
}

export const QUESTION_REPEAT_RULES = repeatRules.map(({ key, label }) => ({ key, label }));
export const QUESTION_STUDY_HOOK_RULES = studyHookRules.map(({ key, label }) => ({ key, label }));
