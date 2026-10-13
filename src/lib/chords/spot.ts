import { formatChord, parseChord, transposeChord } from './chord';

// A chord on screen, traced back to the ChordPro text: its source line and its
// position among the bracketed chords of that line.
export type ChordSpot = { line: number; chord: number };

// Text range of the whole "[...]" of a chord. Chords borrowed from an earlier
// section have no bracket of their own, so they have no range.
export function spotRange(body: string, spot: ChordSpot): { start: number; end: number } | null {
  const lines = body.split('\n');
  const line = lines[spot.line];
  if (line === undefined) return null;
  const match = [...line.matchAll(/\[[^\]]*\]/g)][spot.chord];
  if (!match) return null;
  const start = lines.slice(0, spot.line).reduce((total, text) => total + text.length + 1, 0) + match.index;
  return { start, end: start + match[0].length };
}

// Replaces the chord at `spot`, or removes it when `name` is null. Returns
// null when the chord has no bracket in the text.
export function replaceChord(body: string, spot: ChordSpot, name: string | null): string | null {
  const range = spotRange(body, spot);
  if (!range) return null;
  return body.slice(0, range.start) + (name === null ? '' : `[${name}]`) + body.slice(range.end);
}

// Turns a chord typed over the displayed (transposed) sheet back into the
// English name stored in the text.
export function sourceChordName(input: string, transpose: number, preferFlats: boolean): string | null {
  const chord = parseChord(input.trim());
  if (!chord) return null;
  return formatChord(transposeChord(chord, -transpose, preferFlats), 'english');
}
