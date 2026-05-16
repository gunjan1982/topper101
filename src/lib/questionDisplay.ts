type QuestionDisplayInput = {
  question_text: string;
  marks?: number | null;
};

const footerPatterns = [
  /\(cid:\d+\)/gi,
  /\([A-Z]-\d{2,4}\)/gi,
  /\bP\.?\s*T\.?\s*O\.?\b.*$/i,
  /\bP\.?\s*T\.?\s*\d+\.?\b.*$/i,
  /\bNo\.?\s+of\s+Printed\s+Pages\b.*$/i,
  /\bMASTER\s+OF\s+ARTS\b.*$/i,
  /\bTerm-End\s+Examination\b.*$/i,
  /\bM\.?\s*A\.?\s*\(PSYCHOLOGY\).*$/i,
  /\b[A-Z]\s*[–-]\s*\d{2,4}\s*\/\s*MPC[E]?\s*[–-]?\s*\d{3}\b.*$/i,
  /\bMPC[E]?\s*[–-]\s*\d{3}\b.*$/i,
  /\[\s*\d+\s*\].*$/i,
  /×(?:\s*×)+.*$/i,
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function formatQuestionSession(session: string | null | undefined, year: number | null | undefined) {
  if (!session || !year) return 'Unknown TEE';
  const shortSession = session === 'June' ? 'Jun' : session === 'December' ? 'Dec' : session;
  return `${shortSession} ${year}`;
}

export function cleanQuestionText(question: QuestionDisplayInput) {
  let text = question.question_text
    .replace(/\u00a0/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  footerPatterns.forEach((pattern) => {
    text = text.replace(pattern, '').trim();
  });

  text = text
    .replace(/\s+\d+\s*\+\s*\d+\s*$/g, '')
    .replace(/\s+\.\s*$/g, '')
    .replace(/\s+,/g, ',')
    .replace(/\s+\?/g, ' ?')
    .replace(/\s+/g, ' ')
    .trim();

  const marks = question.marks;
  if (marks) {
    const markFragments = [
      `${marks}`,
      `${marks}.`,
      `${marks} Marks`,
      `${marks} marks`,
      `${marks}m`,
    ];

    markFragments.forEach((fragment) => {
      text = text.replace(new RegExp(`\\s+${escapeRegExp(fragment)}\\s*$`, 'i'), '').trim();
    });

    text = text.replace(/\s+\d+\s*\+\s*\d+\s*$/g, '').trim();
  }

  return text.replace(/\s+\.\s*$/g, '').trim();
}

export function normalizeQuestionText(question: QuestionDisplayInput) {
  return cleanQuestionText(question)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(what|is|are|the|a|an|and|of|in|to|with|by|as|given|explain|describe|discuss|critically|analyse|analyze)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
