import { type Chord, triadQuality } from './chord';
import { pitchClass } from './notes';

const TRIADS: Record<ReturnType<typeof triadQuality>, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
};

const DEGREE: Record<string, number> = { '2': 2, '4': 5, '6': 9, '9': 14, '11': 17, '13': 21 };

// Chord tones as intervals above the root, read from the suffix. Covers what
// real sheets use: qualities, sus, 6/7/9/11/13, add, and b/# alterations.
export function chordIntervals(suffix: string): number[] {
  const tones = new Set(TRIADS[triadQuality(suffix)]);
  let rest = suffix.replace(/^(maj|min|dim|aug|m(?!aj)|M(?=\d|$)|-|\+|°|ø)/, '');
  if (/^(M|maj|Δ|\^)/.test(suffix)) rest = suffix.replace(/^(M|maj|Δ|\^)/, 'maj');

  const sus = /sus([24])?/.exec(rest);
  // Italian sheets write "SOL4" / "SOL7 4" style shorthand for sus4.
  const bareSus = /^(7)?([24])$/.exec(rest);
  if (sus || bareSus) {
    tones.delete(3);
    tones.delete(4);
    tones.add((sus?.[1] ?? bareSus?.[2]) === '2' ? 2 : 5);
    if (bareSus?.[1]) tones.add(10);
    rest = rest.replace(/sus[24]?/, '');
    if (bareSus) rest = '';
  }

  if (/b5/.test(rest)) {
    tones.delete(7);
    tones.add(6);
  }
  if (/#5|\+5/.test(rest) || /^7?\+$/.test(rest)) {
    tones.delete(7);
    tones.add(8);
  }
  if (suffix.startsWith('ø')) tones.add(10);
  const diminished = /^(dim|°)7/.test(suffix);
  const seventh = diminished ? 9 : /^maj/.test(rest) ? 11 : 10;
  const extension = /^(?:maj)?(7|9|11|13)/.exec(rest);
  if (extension?.[1]) {
    tones.add(seventh);
    const top = Number(extension[1]);
    if (top >= 9) tones.add(14);
    if (top >= 11) tones.add(17);
    if (top >= 13) tones.add(21);
  }
  if (/^6/.test(rest) || /6\/9|69/.test(rest)) tones.add(9);
  if (/6\/9|69/.test(rest)) tones.add(14);

  for (const match of rest.matchAll(/(add|[b#])(\d+)/g)) {
    const degree = DEGREE[match[2] ?? ''];
    if (degree === undefined) continue;
    const shift = match[1] === 'b' ? -1 : match[1] === '#' ? 1 : 0;
    tones.add(degree + shift);
    if (shift !== 0) tones.delete(degree);
  }

  return [...tones].sort((a, b) => a - b);
}

export type Voicing = { keys: number[]; octaves: number };

// Close position voicing, bass first, as semitone offsets from the C at the
// left edge of the drawn keyboard.
export function chordVoicing(chord: Chord): Voicing {
  const root = pitchClass(chord.root);
  const classes = chordIntervals(chord.suffix).map((interval) => (root + interval) % 12);
  const unique = classes.filter((pc, index) => classes.indexOf(pc) === index);
  const bass = chord.bass ? pitchClass(chord.bass) : null;
  const order = bass !== null && bass !== root ? [bass, ...unique] : unique;

  const keys: number[] = [];
  for (const pc of order) {
    const previous = keys.at(-1);
    if (previous === undefined) {
      keys.push(pc);
      continue;
    }
    let next = previous - (previous % 12) + pc;
    while (next <= previous) next += 12;
    keys.push(next);
  }
  const highest = keys.at(-1) ?? 0;
  return { keys, octaves: Math.max(2, Math.ceil((highest + 1) / 12)) };
}
