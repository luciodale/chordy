import { isChord } from './chord';
import type { Segment, Sheet, SheetLine } from './chordpro';

// Uploaders often write chords for "Verse 1" / "Chorus 1" only and leave
// later verses and choruses bare. When a numbered section has no chords at
// all, borrow them line by line from the latest earlier section with the
// same name. Only the uploader's own chords are reused, and the label says
// where they came from.

function baseName(label: string): string {
  return label
    .replace(/\s*\d+\s*:?\s*$/, '')
    .trim()
    .toLowerCase();
}

type Offsets = { text: string; chords: { chord: string; at: number }[] };

function chordOffsets(segments: Segment[]): Offsets {
  const joined = segments.map((segment) => segment.text).join('');
  const lead = joined.length - joined.trimStart().length;
  const chords: Offsets['chords'] = [];
  let position = 0;
  for (const segment of segments) {
    // Only real chords travel; notes like "(1:)" belong where they were written.
    if (segment.chord !== null && isChord(segment.chord)) {
      chords.push({ chord: segment.chord, at: Math.max(0, position - lead) });
    }
    position += segment.text.length;
  }
  return { text: joined.trim(), chords };
}

function wordStarts(text: string): number[] {
  const starts: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== ' ' && (index === 0 || text[index - 1] === ' ')) starts.push(index);
  }
  return starts;
}

// Places the template's chords on the target line at the same relative
// position, snapped to the nearest word start.
export function borrowChords(template: Segment[], target: Segment[]): Segment[] {
  const source = chordOffsets(template);
  const text = target
    .map((segment) => segment.text)
    .join('')
    .trim();
  if (!text || source.chords.length === 0 || !source.text) return target;

  const starts = wordStarts(text);
  const placed = source.chords.map(({ chord, at }) => {
    if (at >= source.text.length) return { chord, at: text.length };
    const wanted = (at / source.text.length) * text.length;
    const nearest = starts.reduce((best, start) => (Math.abs(start - wanted) < Math.abs(best - wanted) ? start : best), 0);
    return { chord, at: nearest };
  });

  const segments: Segment[] = [];
  const first = placed[0]?.at ?? 0;
  if (first > 0) segments.push({ chord: null, text: text.slice(0, first) });
  placed.forEach((chord, index) => {
    const end = placed[index + 1]?.at ?? text.length;
    segments.push({ chord: chord.chord, text: text.slice(chord.at, Math.max(chord.at, end)) });
  });
  return segments;
}

type Section = { label: number; base: string; lyrics: number[] };

function isSung(line: SheetLine | undefined): line is Extract<SheetLine, { kind: 'lyrics' }> {
  return line?.kind === 'lyrics' && line.segments.some((segment) => segment.text.trim() !== '');
}

export function fillRepeatedSections(sheet: Sheet): Sheet {
  const lines = [...sheet.lines];
  const sections: Section[] = [];
  lines.forEach((line, index) => {
    if (line.kind === 'label' || line.kind === 'comment') {
      sections.push({ label: index, base: baseName(line.text), lyrics: [] });
    } else if (isSung(line)) {
      sections.at(-1)?.lyrics.push(index);
    }
  });

  const templates = new Map<string, Section>();
  for (const section of sections) {
    if (!section.base || section.lyrics.length === 0) continue;
    const hasChords = section.lyrics.some((index) => {
      const line = lines[index];
      return line?.kind === 'lyrics' && line.hasChords;
    });
    if (hasChords) {
      templates.set(section.base, section);
      continue;
    }
    const template = templates.get(section.base);
    if (!template) continue;

    const count = Math.min(template.lyrics.length, section.lyrics.length);
    for (let row = 0; row < count; row += 1) {
      const from = lines[template.lyrics[row] ?? -1];
      const index = section.lyrics[row] ?? -1;
      const to = lines[index];
      if (from?.kind !== 'lyrics' || to?.kind !== 'lyrics') continue;
      const segments = borrowChords(from.segments, to.segments);
      lines[index] = { ...to, segments, hasChords: segments.some((segment) => segment.chord !== null) };
    }
    const labelLine = lines[section.label];
    const templateLabel = lines[template.label];
    if ((labelLine?.kind === 'label' || labelLine?.kind === 'comment') && templateLabel && 'text' in templateLabel) {
      lines[section.label] = { ...labelLine, note: `chords from ${templateLabel.text}` };
    }
  }
  return { ...sheet, lines };
}
