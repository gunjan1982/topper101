export interface BlockOffset {
  blockNumber: number;
  startPage: number; // The absolute page in the combined PDF where this block starts (1-indexed)
  title?: string;
}

// Map of course codes to their block offsets.
// As we verify the exact page lengths of the compiled books, we can define the precise start points.
export const TEXTBOOK_OFFSETS: Record<string, BlockOffset[]> = {
  'MPC-001': [
    { blockNumber: 1, startPage: 1, title: 'Cognitive Psychology' },
    { blockNumber: 2, startPage: 55, title: 'Information Processing' },
    { blockNumber: 3, startPage: 115, title: 'Language and Cognitive Processes' },
    { blockNumber: 4, startPage: 175, title: 'Problem Solving and Creativity' },
  ],
  'MPC-002': [
    { blockNumber: 1, startPage: 1, title: 'Introduction to Lifespan Development' },
    { blockNumber: 2, startPage: 48, title: 'Infancy and Early Childhood' },
    { blockNumber: 3, startPage: 104, title: 'Middle Childhood and Adolescence' },
    { blockNumber: 4, startPage: 160, title: 'Adulthood and Aging' },
  ],
  'MPC-003': [
    { blockNumber: 1, startPage: 1, title: 'Introduction to Personality' },
    { blockNumber: 2, startPage: 52, title: 'Theories of Personality I' },
    { blockNumber: 3, startPage: 110, title: 'Theories of Personality II' },
    { blockNumber: 4, startPage: 168, title: 'Assessment of Personality' },
  ],
  'MPC-004': [
    { blockNumber: 1, startPage: 1, title: 'Introduction to Social Psychology' },
    { blockNumber: 2, startPage: 42, title: 'Social Cognition and Attribution' },
    { blockNumber: 3, startPage: 98, title: 'Attitude and Social Influence' },
    { blockNumber: 4, startPage: 154, title: 'Group Dynamics and Intergroup Relations' },
  ],
  'MPC-005': [
    { blockNumber: 1, startPage: 1, title: 'Introduction to Research in Psychology' },
    { blockNumber: 2, startPage: 56, title: 'Research Design' },
    { blockNumber: 3, startPage: 118, title: 'Tools of Data Collection' },
    { blockNumber: 4, startPage: 172, title: 'Qualitative Research in Psychology' },
  ],
  'MPC-006': [
    { blockNumber: 1, startPage: 1, title: 'Introduction to Statistics' },
    { blockNumber: 2, startPage: 48, title: 'Descriptive Statistics' },
    { blockNumber: 3, startPage: 102, title: 'Inferential Statistics' },
    { blockNumber: 4, startPage: 158, title: 'Parametric and Non-Parametric Statistics' },
  ],
  'MPCE-012': [
    { blockNumber: 1, startPage: 1, title: 'Introduction to Psychopathology' },
    { blockNumber: 2, startPage: 65, title: 'Anxiety and Somatoform Disorders' },
    { blockNumber: 3, startPage: 132, title: 'Mood and Schizophrenic Disorders' },
    { blockNumber: 4, startPage: 198, title: 'Other Disorders' },
  ],
  'MPCE-031': [
    { blockNumber: 1, startPage: 1, title: 'Introduction to Organizational Behaviour' },
    { blockNumber: 2, startPage: 58, title: 'Individual Processes in Organizations' },
    { blockNumber: 3, startPage: 122, title: 'Group Dynamics and Leadership' },
    { blockNumber: 4, startPage: 184, title: 'Dynamics of Organization' },
  ],
};

export interface ResolvedTextbookPage {
  blockNumber: number;
  relativePage: number;
  blockTitle?: string;
  displayLabel: string;
}

/**
 * Resolves an absolute page number inside a combined PDF into its block-relative details.
 * Falls back to basic page number display if the course mapping is missing.
 */
export function resolveTextbookPage(
  courseCode: string,
  absolutePage: number | null | undefined
): ResolvedTextbookPage | null {
  if (!absolutePage || absolutePage <= 0) return null;

  const offsets = TEXTBOOK_OFFSETS[courseCode];
  if (!offsets || offsets.length === 0) {
    return {
      blockNumber: 0,
      relativePage: absolutePage,
      displayLabel: `Page ${absolutePage}`,
    };
  }

  // Find the block that starts closest to (but before or at) the absolutePage
  let matchedBlock = offsets[0];
  for (let i = 1; i < offsets.length; i++) {
    if (absolutePage >= offsets[i].startPage) {
      matchedBlock = offsets[i];
    } else {
      break;
    }
  }

  const relativePage = absolutePage - matchedBlock.startPage + 1;
  const blockLabel = `Block ${matchedBlock.blockNumber}`;

  return {
    blockNumber: matchedBlock.blockNumber,
    relativePage,
    blockTitle: matchedBlock.title,
    displayLabel: `${blockLabel}, Page ${relativePage}`,
  };
}
