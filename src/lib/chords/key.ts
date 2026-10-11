import { type Chord, triadQuality } from './chord';
import { pitchClass } from './notes';

// Major keys written with flats: F, Bb, Eb, Ab, Db.
const FLAT_MAJOR_KEYS = new Set([5, 10, 3, 8, 1]);

export function prefersFlats(key: Chord, semitones: number): boolean {
  const tonic = pitchClass(key.root) + semitones;
  const major = triadQuality(key.suffix) === 'm' ? tonic + 3 : tonic;
  return FLAT_MAJOR_KEYS.has(((major % 12) + 12) % 12);
}
