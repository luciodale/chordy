// Section labels are stored as {c: Label} lines, addressed by their line index
// in the ChordPro text. Each edit returns the new text.

export const SECTION_LABELS = ['Verse', 'Chorus', 'Pre chorus', 'Bridge', 'Intro', 'Outro', 'Solo'] as const;

function labelLine(text: string): string {
  return `{c: ${text.replace(/[{}]/g, '')}}`;
}

export function insertLabel(body: string, text: string, before: number): string {
  const lines = body.split('\n');
  lines.splice(before, 0, labelLine(text));
  return lines.join('\n');
}

export function removeLine(body: string, index: number): string {
  const lines = body.split('\n');
  lines.splice(index, 1);
  return lines.join('\n');
}

export function moveLine(body: string, from: number, before: number): string {
  if (before === from || before === from + 1) return body;
  const lines = body.split('\n');
  const [moved] = lines.splice(from, 1);
  if (moved === undefined) return body;
  lines.splice(before > from ? before - 1 : before, 0, moved);
  return lines.join('\n');
}
