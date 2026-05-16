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

function renderParagraphs(text: string, kind: AnswerBlock['kind']) {
  return text.split(/\n{2,}/).map((paragraph, index) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return null;

    const heading = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (heading) {
      return (
        <h3 key={index} className={`mt-6 text-base font-bold ${kind === 'study-note' ? 'text-sky-800 dark:text-sky-200' : 'text-zinc-950 dark:text-zinc-50'}`}>
          {heading[1]}
        </h3>
      );
    }

    const listItems = trimmed.split('\n').filter((line) => line.trim().startsWith('- '));
    if (listItems.length > 1) {
      return (
        <ul key={index} className="my-3 list-disc space-y-1 pl-5">
          {listItems.map((line, itemIndex) => (
            <li key={itemIndex}>{renderInline(line.trim().replace(/^- /, ''))}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={index} className="my-3 leading-7">
        {renderInline(trimmed)}
      </p>
    );
  });
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
