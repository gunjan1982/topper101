type AnswerBlock = {
  kind: 'core' | 'study-note';
  text: string;
};

function parseAnswerBlocks(answer: string) {
  const blocks: AnswerBlock[] = [];
  const notePattern = /\[\[AI_STUDY_NOTE\]\]([\s\S]*?)\[\[\/AI_STUDY_NOTE\]\]/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = notePattern.exec(answer)) !== null) {
    const coreText = answer.slice(cursor, match.index).trim();
    if (coreText) blocks.push({ kind: 'core', text: coreText });

    const noteText = match[1]?.trim();
    if (noteText) blocks.push({ kind: 'study-note', text: noteText });
    cursor = match.index + match[0].length;
  }

  const remaining = answer.slice(cursor).trim();
  if (remaining) blocks.push({ kind: 'core', text: remaining });

  return blocks.length > 0 ? blocks : [{ kind: 'core' as const, text: answer }];
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function isTableRow(line: string) {
  return line.trim().startsWith('|') && line.trim().endsWith('|');
}

function renderTable(rows: string[], index: number) {
  const parsed = rows.map((r) =>
    r
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim()),
  );
  const [header, separator, ...body] = parsed;
  if (!header || !separator) return null;
  return (
    <div key={index} className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            {header.map((cell, i) => (
              <th key={i} className="border border-zinc-300 px-3 py-2 text-left font-semibold dark:border-zinc-600">
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="even:bg-zinc-50 dark:even:bg-zinc-900/40">
              {row.map((cell, ci) => (
                <td key={ci} className="border border-zinc-300 px-3 py-2 dark:border-zinc-600">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Segment =
  | { type: 'table'; rows: string[] }
  | { type: 'block'; text: string };

function splitIntoSegments(text: string): Segment[] {
  const lines = text.split('\n');
  const segments: Segment[] = [];
  let tableRows: string[] = [];
  let blockLines: string[] = [];

  const flushBlock = () => {
    if (blockLines.length > 0) {
      segments.push({ type: 'block', text: blockLines.join('\n') });
      blockLines = [];
    }
  };
  const flushTable = () => {
    if (tableRows.length >= 2) {
      segments.push({ type: 'table', rows: tableRows });
    } else if (tableRows.length > 0) {
      blockLines.push(...tableRows);
    }
    tableRows = [];
  };

  for (const line of lines) {
    if (isTableRow(line)) {
      flushBlock();
      tableRows.push(line);
    } else {
      flushTable();
      blockLines.push(line);
    }
  }
  flushTable();
  flushBlock();
  return segments;
}

function renderParagraphs(text: string, kind: AnswerBlock['kind']) {
  const segments = splitIntoSegments(text);
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const segment of segments) {
    if (segment.type === 'table') {
      elements.push(renderTable(segment.rows, key++));
      continue;
    }

    for (const paragraph of segment.text.split(/\n{2,}/)) {
      const trimmed = paragraph.trim();
      if (!trimmed) { key++; continue; }

      // Standalone bold line → heading
      const heading = trimmed.match(/^\*\*([^*]+)\*\*$/);
      if (heading) {
        elements.push(
          <h3 key={key++} className={`mt-6 text-base font-bold ${kind === 'study-note' ? 'text-sky-800 dark:text-sky-200' : 'text-zinc-950 dark:text-zinc-50'}`}>
            {heading[1]}
          </h3>,
        );
        continue;
      }

      // Bullet list
      const bulletLines = trimmed.split('\n').filter((l) => l.trim().startsWith('- '));
      if (bulletLines.length > 1) {
        elements.push(
          <ul key={key++} className="my-3 list-disc space-y-1 pl-5">
            {bulletLines.map((line, i) => (
              <li key={i}>{renderInline(line.trim().replace(/^- /, ''))}</li>
            ))}
          </ul>,
        );
        continue;
      }

      // Numbered list
      const numberedLines = trimmed.split('\n').filter((l) => /^\d+\.\s/.test(l.trim()));
      if (numberedLines.length > 1) {
        elements.push(
          <ol key={key++} className="my-3 list-decimal space-y-1 pl-5">
            {numberedLines.map((line, i) => (
              <li key={i}>{renderInline(line.trim().replace(/^\d+\.\s/, ''))}</li>
            ))}
          </ol>,
        );
        continue;
      }

      elements.push(
        <p key={key++} className="my-3 leading-7">
          {renderInline(trimmed)}
        </p>,
      );
    }
  }

  return elements;
}

export default function AnswerRenderer({ answer }: { answer: string }) {
  const blocks = parseAnswerBlocks(answer);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div
          key={index}
          className={block.kind === 'study-note'
            ? 'rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100'
            : 'text-zinc-700 dark:text-zinc-300'}
        >
          {block.kind === 'study-note' && (
            <div className="mb-2 text-xs font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
              AI study note / simplification
            </div>
          )}
          {renderParagraphs(block.text, block.kind)}
        </div>
      ))}
    </div>
  );
}
