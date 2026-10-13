import { type Chord, formatChord, parseChord, simplifyChord, transposeChord } from './chord';
import type { Sheet, SheetLine } from './chordpro';
import type { Notation } from './notes';

export type DisplayOptions = {
  transpose: number;
  simplify: boolean;
  notation: Notation;
  preferFlats: boolean;
};

export type ChordView = { label: string; chord: Chord | null };

// `reserve` means the chord needs its own width because the next chord would
// otherwise overlap it; all other chords float above the text so the lyric
// keeps its natural spacing.
export type Piece = { chord: ChordView | null; text: string; reserve: boolean };

// A word is the smallest unit a line may wrap at, so a chord never leaves the
// syllable it belongs to.
export type Word = Piece[];

// `chordOffset` is how many chords of the same source line come before this
// display line, so a chord on screen maps back to its bracket in the text.
export type DisplayLine =
  | {
      kind: 'lyrics';
      words: Word[];
      hasChords: boolean;
      hasLyrics: boolean;
      inChorus: boolean;
      source: number;
      chordOffset: number;
    }
  | Exclude<SheetLine, { kind: 'lyrics' }>;

export function transformChord(raw: string, options: DisplayOptions): ChordView {
  const parsed = parseChord(raw);
  if (!parsed) return { label: raw, chord: null };
  const simple = options.simplify ? simplifyChord(parsed) : parsed;
  const chord = transposeChord(simple, options.transpose, options.preferFlats);
  return { label: formatChord(chord, options.notation), chord };
}

type Segment = { chord: string | null; text: string };

// Source sheets pad lyrics with spaces to line them up under chords. Once the
// chords are attached to syllables that padding only adds gaps, so leading
// space is dropped and inner runs collapse to one space.
export function tidyLyrics(segments: Segment[]): Segment[] {
  let started = false;
  return segments.map((segment) => {
    let text = segment.text.replace(/\s{2,}/g, ' ');
    if (!started) {
      text = text.replace(/^\s+/, '');
      started = text !== '';
    }
    return { chord: segment.chord, text };
  }).filter((segment) => segment.chord !== null || segment.text !== '');
}

// The sheet is set in a monospace font, so character counts are exact widths.
// A chord reserves width when the text up to the next chord is shorter than
// its name plus one character of breathing room; otherwise it floats and the
// lyric keeps its natural spacing.
function markReserved(pieces: Piece[]) {
  pieces.forEach((piece, index) => {
    if (!piece.chord) return;
    let distance = 0;
    for (let next = index; next < pieces.length; next += 1) {
      const candidate = pieces[next];
      if (!candidate) break;
      if (next > index && candidate.chord) {
        piece.reserve = distance < piece.chord.label.length + 1;
        return;
      }
      distance += candidate.text.length;
    }
  });
}

// Chords placed past the last sung syllable belong to the instrumental bit
// after the phrase. Split them off so they get their own line instead of
// crowding the chords of the sung text.
export function splitTrailingChords(segments: Segment[]): { sung: Segment[]; tail: Segment[] } {
  let lastSung = -1;
  segments.forEach((segment, index) => {
    if (segment.text.trim() !== '') lastSung = index;
  });
  if (lastSung === -1) return { sung: segments, tail: [] };
  const tail = segments.slice(lastSung + 1).filter((segment) => segment.chord !== null);
  return { sung: segments.slice(0, lastSung + 1), tail };
}

export function toWords(segments: Segment[], options: DisplayOptions): Word[] {
  const words: Word[] = [];
  const pieces: Piece[] = [];
  let current: Word = [];
  for (const segment of segments) {
    const parts = segment.text === '' ? [''] : segment.text.split(/(?<=\s)(?=\S)/);
    parts.forEach((part, index) => {
      const chord = index === 0 && segment.chord !== null ? transformChord(segment.chord, options) : null;
      const piece = { chord, text: part, reserve: false };
      current.push(piece);
      pieces.push(piece);
      if (/\s$/.test(part)) {
        words.push(current);
        current = [];
      }
    });
  }
  if (current.length > 0) words.push(current);
  markReserved(pieces);
  return words;
}

export function renderSheet(sheet: Sheet, options: DisplayOptions): DisplayLine[] {
  return sheet.lines.flatMap((line): DisplayLine[] => {
    if (line.kind !== 'lyrics') return [line];
    // Instrumental lines carry chords only; they need no lyric row, and their
    // spacing is what separates the chords.
    const hasLyrics = line.segments.some((segment) => segment.text.trim() !== '');
    if (!hasLyrics) {
      return [
        {
          kind: 'lyrics',
          words: toWords(line.segments, options),
          hasChords: line.hasChords,
          hasLyrics,
          inChorus: line.inChorus,
          source: line.source,
          chordOffset: 0,
        },
      ];
    }
    const { sung, tail } = splitTrailingChords(line.segments);
    const rendered: DisplayLine[] = [
      {
        kind: 'lyrics',
        words: toWords(tidyLyrics(sung), options),
        hasChords: sung.some((segment) => segment.chord !== null),
        hasLyrics,
        inChorus: line.inChorus,
        source: line.source,
        chordOffset: 0,
      },
    ];
    if (tail.length > 0) {
      rendered.push({
        kind: 'lyrics',
        words: toWords(tail.map((segment) => ({ chord: segment.chord, text: ' ' })), options),
        hasChords: true,
        hasLyrics: false,
        inChorus: line.inChorus,
        source: line.source,
        chordOffset: sung.filter((segment) => segment.chord !== null).length,
      });
    }
    return rendered;
  });
}
