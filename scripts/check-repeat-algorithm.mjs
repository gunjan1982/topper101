import assert from 'node:assert/strict';
import { loadRepeatAlgorithm } from './lib/repeat-algorithm-loader.mjs';

const {
  questionRepeatKey,
  questionStudyHookKey,
  questionIntelligence,
} = loadRepeatAlgorithm();

const families = [
  {
    name: 'Sternberg triarchic theory',
    expected: 'concept:sternberg-triarchic-theory-of-intelligence',
    questions: [
      'Analyze Sternberg\'s triarchic theory of intelligence. Critically evaluate triarchic theory of intelligence. 8+2',
      'Define Intelligence. Explain Sternberg’s triarchic theory of intelligence. 3+7 MPC-001 1 P.T.O.',
      'Explain the three components of triarchic theory of intelligence by Sternberg. 6',
      'Explain Sternberg’s triarchic theory of intelligence. 10',
    ],
  },
  {
    name: 'Alfred Binet contribution',
    expected: 'concept:alfred-binet-intelligence-testing',
    questions: [
      'Contribution of Alfred Binet. 3 × × × × × × × A–276/MPC–001 MPC–001 No. of Printed Pages : 3 MASTER OF ARTS (PSYCHOLOGY) (MAPC) Term-End Examination',
      'Explain the concept of intelligence quotient (I. Q.). Discuss the contribution of Alfred Binet towards intelligence testing. 2 + 4',
      'Describe the contribution of Alfred Binet to the measurement of intelligence. 6',
    ],
  },
  {
    name: 'Spearman two-factor theory',
    expected: 'concept:spearman-two-factor-theory',
    questions: [
      'Describe Spearman’s two-factor theory of intelligence. Provide critical appraisal of his theory as given by Thorndike, Thomson and Thurstone. 10',
      'Describe Spearman\'s two-factor theory of intelligence. 6',
    ],
  },
  {
    name: 'Bloom taxonomy',
    expected: 'concept:bloom-taxonomy-cognitive-domain',
    questions: [
      'Bloom’s taxonomy of cognitive domain. 3',
      'Explain Bloom’s taxonomy of cognitive domain. 6',
      'What is information processing ? Describe Bloom\'s taxonomy of cognitive domain. 2+4',
    ],
  },
  {
    name: 'Aphasia',
    expected: 'concept:aphasia-types-language-disorder',
    questions: [
      'Aphasia. 3 MPC–001 MPC-001 No. of Printed Pages : 3 MASTER OF ARTS (PSYCHOLOGY) (MAPC) Term-End Examination',
      'Explain aphasia and its types. 6',
      'Describe the various types of aphasia.',
      'Explain aphasia as a language disorder. 6',
    ],
  },
  {
    name: 'Sensory, STM, LTM memory',
    expected: 'concept:sensory-short-term-long-term-memory',
    questions: [
      'Differentiate between sensory memory, short-term memory and long-term memory. 6',
      'Difference between short-term and long-term memory.',
    ],
  },
  {
    name: 'Cognitive psychology domains',
    expected: 'concept:cognitive-psychology-domains',
    questions: [
      'Describe the domains of Cognitive Psychology. 10 A–280/MPC-001 P. T. O. [ 2 ] MPC–001',
      'Describe the principal areas of research in cognitive psychology. 6',
      'Discuss the domains of cognitive psychology. 10',
    ],
  },
  {
    name: 'Problem-solving strategies and factors',
    expected: 'concept:problem-solving-strategies-stages-factors',
    questions: [
      'Discuss the strategies of problem solving and explain the factors affecting problem solving. 5+5',
      'Describe the stages and strategies of problem solving. 3+7',
      'Explain the techniques in problem solving. 6 A–276/MPC–001 [ 3 ]',
    ],
  },
  {
    name: 'Gestalt approach to problem solving',
    expected: 'concept:problem-solving-gestalt-approach',
    questions: [
      'Explain the traditional approach and Gestalt’s approach to problem solving. 6',
      'Describe the Gestalt approach to problem solving. 6 A–280/MPC-001 [ 3 ]',
    ],
  },
  {
    name: 'Information processing principles',
    expected: 'concept:information-processing-principles',
    questions: [
      'Principles of Information Processing 3',
      'Describe the principles of information processing.',
      'Explain the information processing approach to learning and memory. 6',
    ],
  },
  {
    name: 'Language acquisition theories',
    expected: 'concept:language-acquisition-theories',
    questions: [
      'Critically discuss the Innateness theory of Chomsky. 6',
      'Compare and contrast behaviouristic theory and innate theory of language acquisition. 10',
      'Discuss Jean Piaget’s cognitive theory of language acquisition. 6',
    ],
  },
  {
    name: 'Biological memory bases',
    expected: 'concept:cellular-biological-bases-memory-learning',
    questions: [
      'Discuss the relationship between memory and brain. 10',
      'Memory consolidation. 3',
      'Cellular bases of learning and memory 3',
    ],
  },
  {
    name: 'Creativity meaning and stages',
    expected: 'concept:creativity-meaning-aspects-stages',
    questions: [
      'Explain the meaning, aspects and stages of creativity. 10',
      'Describe the stages in creative discoveries. 6',
    ],
  },
  {
    name: 'Primary and secondary memory model',
    expected: 'concept:waugh-norman-primary-secondary-memory',
    questions: [
      'Models of Primary and Secondary Memory. 3',
      'Explain Waugh and Norman’s model of primary and secondary memory. 6',
    ],
  },
];

for (const family of families) {
  family.questions.forEach((questionText) => {
    assert.equal(
      questionRepeatKey({ question_text: questionText, marks: 10 }),
      family.expected,
      `${family.name} failed for: ${questionText}`,
    );
  });
}

assert.notEqual(
  questionRepeatKey({ question_text: 'Describe the principles of information processing. Explain Sternberg’s information processing approach. 4+6', marks: 10 }),
  'concept:sternberg-triarchic-theory-of-intelligence',
  'Sternberg information-processing approach must not collapse into triarchic theory.',
);

assert.equal(
  questionRepeatKey({ question_text: "Discuss the Stemberg's information processing approach. 6", marks: 6 }),
  'concept:sternberg-information-processing-approach',
  'Common OCR typo "Stemberg" should stay with Sternberg information-processing approach.',
);

const studyHookCases = [
  {
    name: 'intelligence theories study hook keeps exact families separate',
    expectedHook: 'study-hook:mpc-001:intelligence-theories',
    cases: [
      {
        question_text: 'Explain Sternberg’s triarchic theory of intelligence. 10',
        expectedFamily: 'concept:sternberg-triarchic-theory-of-intelligence',
      },
      {
        question_text: 'Describe Spearman’s two-factor theory of intelligence. 6',
        expectedFamily: 'concept:spearman-two-factor-theory',
      },
      {
        question_text: 'Contribution of Alfred Binet. 3',
        expectedFamily: 'concept:alfred-binet-intelligence-testing',
      },
    ],
  },
  {
    name: 'memory study hook keeps model families separate',
    expectedHook: 'study-hook:mpc-001:memory-models-and-systems',
    cases: [
      {
        question_text: 'Discuss the Atkinson and Shiffrin’s model of information processing. 10',
        expectedFamily: 'concept:atkinson-shiffrin-memory-model',
      },
      {
        question_text: 'Explain Waugh and Norman’s model of primary and secondary memory. 6',
        expectedFamily: 'concept:waugh-norman-primary-secondary-memory',
      },
      {
        question_text: 'Explain the levels of processing model by Craik and Lockhart. 10',
        expectedFamily: 'concept:levels-of-processing-craik-lockhart',
      },
    ],
  },
  {
    name: 'problem solving study hook keeps families separate',
    expectedHook: 'study-hook:mpc-001:problem-solving',
    cases: [
      {
        question_text: 'Describe the environmental and cultural blocks in problem solving. 6',
        expectedFamily: 'concept:problem-solving-blocks',
      },
      {
        question_text: 'Describe the Gestalt approach to problem solving. 6',
        expectedFamily: 'concept:problem-solving-gestalt-approach',
      },
      {
        question_text: 'Discuss the strategies of problem solving and explain the factors affecting problem solving. 5+5',
        expectedFamily: 'concept:problem-solving-strategies-stages-factors',
      },
    ],
  },
];

for (const hookCase of studyHookCases) {
  for (const item of hookCase.cases) {
    const question = { ...item, course_code: 'MPC-001', marks: 10 };
    const intelligence = questionIntelligence(question);

    assert.equal(
      intelligence.studyHookKey,
      hookCase.expectedHook,
      `${hookCase.name} produced wrong study hook for: ${item.question_text}`,
    );
    assert.equal(
      intelligence.repeatFamilyKey,
      item.expectedFamily,
      `${hookCase.name} produced wrong repeat family for: ${item.question_text}`,
    );
  }
}

assert.equal(
  questionStudyHookKey({
    course_code: 'MPC-001',
    question_text: 'Discuss the relationship between memory and brain. 10',
    marks: 10,
  }),
  'study-hook:mpc-001:biological-bases-memory-learning',
  'Memory-and-brain questions should stay in the biological memory hook, not the generic memory hook.',
);

console.log(`Repeat intelligence guardrail passed for ${families.length} repeat families and ${studyHookCases.length} study-hook families.`);
