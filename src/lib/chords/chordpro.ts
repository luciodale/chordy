export type Segment = { chord: string | null; text: string };

// `source` is the line's index in the ChordPro text, so a block on screen can be
// traced back to the lines that produced it.
export type SheetLine =
  | { kind: 'lyrics'; segments: Segment[]; hasChords: boolean; inChorus: boolean; source: number }
  | { kind: 'label'; text: string; source: number; note?: string }
  | { kind: 'comment'; text: string; source: number; note?: string }
  | { kind: 'empty'; source: number };

export type SheetMeta = { title?: string; artist?: string; key?: string; tempo?: string };

export type Sheet = { meta: SheetMeta; lines: SheetLine[] };

const DIRECTIVE = /^\{\s*([a-z_]+)\s*(?::\s*(.*?))?\s*\}$/i;

const META_ALIASES: Record<string, keyof SheetMeta> = {
  title: 'title',
  t: 'title',
  artist: 'artist',
  subtitle: 'artist',
  st: 'artist',
  key: 'key',
  tempo: 'tempo',
};

// The chorus needs no default label: its lines carry `inChorus` instead.
const SECTION_START: Record<string, string> = {
  start_of_chorus: '',
  soc: '',
  start_of_verse: '',
  sov: '',
  start_of_bridge: 'Bridge',
  sob: 'Bridge',
};

const COMMENTS = new Set(['comment', 'c', 'comment_italic', 'ci', 'comment_box', 'cb', 'highlight']);

export function parseSegments(line: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /\[([^\]]*)\]/g;
  let cursor = 0;
  let chord: string | null = null;
  for (const match of line.matchAll(pattern)) {
    const text = line.slice(cursor, match.index);
    if (chord !== null || text.length > 0) segments.push({ chord, text });
    chord = match[1]?.trim() ?? '';
    cursor = match.index + match[0].length;
  }
  const tail = line.slice(cursor);
  if (chord !== null || tail.length > 0) segments.push({ chord, text: tail });
  return segments;
}

export function parseChordPro(source: string): Sheet {
  const meta: SheetMeta = {};
  const lines: SheetLine[] = [];
  let inChorus = false;

  source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .forEach((raw, index) => {
      const line = raw.replace(/\s+$/, '');
      if (line.startsWith('#')) return;

      const directive = DIRECTIVE.exec(line.trim());
      if (directive) {
        const name = (directive[1] ?? '').toLowerCase();
        const value = directive[2] ?? '';
        const metaKey = META_ALIASES[name];
        if (metaKey) {
          meta[metaKey] = value;
        } else if (name in SECTION_START) {
          if (name === 'soc' || name === 'start_of_chorus') inChorus = true;
          const label = value || SECTION_START[name];
          if (label) lines.push({ kind: 'label', text: label, source: index });
        } else if (name === 'eoc' || name === 'end_of_chorus') {
          inChorus = false;
        } else if (COMMENTS.has(name) && value) {
          lines.push({ kind: 'comment', text: value, source: index });
        }
        return;
      }

      if (line.trim() === '') {
        if (lines.at(-1)?.kind !== 'empty') lines.push({ kind: 'empty', source: index });
        return;
      }

      const segments = parseSegments(line);
      lines.push({
        kind: 'lyrics',
        segments,
        hasChords: segments.some((segment) => segment.chord !== null),
        inChorus,
        source: index,
      });
    });

  while (lines[0]?.kind === 'empty') lines.shift();
  while (lines.at(-1)?.kind === 'empty') lines.pop();
  return { meta, lines };
}

export function firstChord(sheet: Sheet): string | null {
  for (const line of sheet.lines) {
    if (line.kind !== 'lyrics') continue;
    const found = line.segments.find((segment) => segment.chord);
    if (found?.chord) return found.chord;
  }
  return null;
}
