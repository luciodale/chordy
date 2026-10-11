export type Notation = 'english' | 'italian';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const LETTER_PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const ITALIAN_TO_LETTER: Record<string, string> = {
  DO: 'C',
  RE: 'D',
  MI: 'E',
  FA: 'F',
  SOL: 'G',
  LA: 'A',
  SI: 'B',
};

const LETTER_TO_ITALIAN: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
};

// Italian roots are tried before English ones so "Do7" is not read as D + "o7".
// Lowercase is refused on purpose: "la", "mi", "si" are everyday lyric words.
const NOTE_PATTERN = /^(?:(DO|RE|MI|FA|SOL|LA|SI|Do|Re|Mi|Fa|Sol|La|Si)|([A-G]))([#b]?)/;

export type ParsedNote = { name: string; length: number; italian: boolean };

// Reads a note name at the start of `text`, in either notation, and returns it
// spelled in English (e.g. "Sib" -> "Bb").
export function readNote(text: string): ParsedNote | null {
  const match = NOTE_PATTERN.exec(text);
  if (!match) return null;
  const [whole, italian, letter, accidental] = match;
  const base = italian ? ITALIAN_TO_LETTER[italian.toUpperCase()] : letter;
  if (!base) return null;
  return { name: base + accidental, length: whole.length, italian: Boolean(italian) };
}

export function pitchClass(note: string): number {
  const base = LETTER_PITCH[note[0] ?? ''] ?? 0;
  const accidental = note[1] === '#' ? 1 : note[1] === 'b' ? -1 : 0;
  return (base + accidental + 12) % 12;
}

export function noteName(pitch: number, preferFlats: boolean): string {
  const index = ((pitch % 12) + 12) % 12;
  return (preferFlats ? FLAT_NAMES : SHARP_NAMES)[index] ?? 'C';
}

export function displayNote(note: string, notation: Notation): string {
  if (notation === 'english') return note;
  return (LETTER_TO_ITALIAN[note[0] ?? ''] ?? note[0]) + note.slice(1);
}
