import { type Notation, displayNote, noteName, pitchClass, readNote } from './notes';

export type Chord = { root: string; suffix: string; bass: string | null };

// Everything that may follow a root: qualities, extensions, alterations.
const SUFFIX_PATTERN =
  /^(?:maj|min|dim|aug|sus|add|alt|omit|no|m|M|\+|°|ø|-|\^|Δ|\d+|#|b|\(|\)|,|\*)*$/;

export function parseChord(token: string): Chord | null {
  const root = readNote(token);
  if (!root) return null;
  let rest = token.slice(root.length);
  let bass: string | null = null;

  const slash = rest.lastIndexOf('/');
  if (slash !== -1) {
    const after = rest.slice(slash + 1);
    // "6/9" is an extension, not a slash chord.
    if (!/^\d+$/.test(after)) {
      const bassNote = readNote(after);
      // Sheets sometimes write the bass as "RE#m"; a bass note has no quality,
      // so a stray "m" is dropped rather than rejecting the chord.
      const strayMinor = after.length === (bassNote?.length ?? 0) + 1 && after.endsWith('m');
      if (!bassNote || (bassNote.length !== after.length && !strayMinor)) return null;
      bass = bassNote.name;
      rest = rest.slice(0, slash);
    }
  }

  // Italian sheets write "MIb7/4" for Eb7sus4, "LAm7/4" for Am7sus4 and
  // "LA/4" for Asus4.
  rest = rest.replace(/^((?:m|-)?7?)\/([24])$/, '$1sus$2');
  if (!SUFFIX_PATTERN.test(rest.replace('6/9', '69'))) return null;
  // Italian sheets write minor as "La-" and major seventh as "Si7+"; in
  // English "7+" would mean augmented, so both are spelled out.
  let suffix = rest.startsWith('-') ? `m${rest.slice(1)}` : rest;
  if (root.italian) suffix = suffix.replace('7+', 'maj7');
  return { root: root.name, suffix, bass };
}

export function isChord(token: string): boolean {
  return parseChord(token) !== null;
}

export function formatChord(chord: Chord, notation: Notation): string {
  const bass = chord.bass ? `/${displayNote(chord.bass, notation)}` : '';
  return displayNote(chord.root, notation) + chord.suffix + bass;
}

export function transposeChord(chord: Chord, semitones: number, preferFlats: boolean): Chord {
  if (semitones % 12 === 0) return chord;
  return {
    root: noteName(pitchClass(chord.root) + semitones, preferFlats),
    suffix: chord.suffix,
    bass: chord.bass ? noteName(pitchClass(chord.bass) + semitones, preferFlats) : null,
  };
}

export type TriadQuality = '' | 'm' | 'dim' | 'aug';

export function triadQuality(suffix: string): TriadQuality {
  if (/^(dim|°|ø)/.test(suffix) || /^m7?b5/.test(suffix)) return 'dim';
  if (/^(aug|\+)/.test(suffix)) return 'aug';
  if (/^(m(?!aj)|min)/.test(suffix)) return 'm';
  return '';
}

// Reduces any chord to its plain triad; the bass note survives because it is
// what the left hand plays.
export function simplifyChord(chord: Chord): Chord {
  return { ...chord, suffix: triadQuality(chord.suffix) };
}
