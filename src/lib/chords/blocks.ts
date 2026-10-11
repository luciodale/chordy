import type { DisplayLine } from './render';

export type SheetBlock = {
  label: string | null;
  // Line of the label in the ChordPro text when it can be moved or removed
  // (a {c: ...} line); null when there is none or it comes from {soc}.
  labelSource: number | null;
  lines: DisplayLine[];
};

// Splits the sheet into paragraphs at blank lines and section labels. Labels
// are only ever what the sheet says: nothing is inferred.
export function groupBlocks(lines: DisplayLine[]): SheetBlock[] {
  const blocks: SheetBlock[] = [];
  let current: SheetBlock | null = null;

  function close() {
    if (current && (current.lines.length > 0 || current.label)) blocks.push(current);
    current = null;
  }

  for (const line of lines) {
    if (line.kind === 'empty') {
      // A label directly followed by a blank line still heads the next block.
      if (current && current.lines.length > 0) close();
      continue;
    }
    if (line.kind === 'label' || line.kind === 'comment') {
      close();
      current = { label: line.text, labelSource: line.source, lines: [] };
      continue;
    }
    if (!current) {
      current = { label: line.inChorus ? 'Chorus' : null, labelSource: null, lines: [] };
    }
    current.lines.push(line);
  }
  close();
  return blocks;
}
