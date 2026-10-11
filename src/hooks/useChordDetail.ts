import { useMemo } from 'react';
import type { Notation } from '@/lib/chords/notes';
import { displayNote, noteName } from '@/lib/chords/notes';
import { chordVoicing } from '@/lib/chords/piano';
import type { ChordView } from '@/lib/chords/render';

export function useChordDetail(chord: ChordView, notation: Notation, preferFlats: boolean) {
  return useMemo(() => {
    if (!chord.chord) return null;
    const voicing = chordVoicing(chord.chord);
    const names = voicing.keys.map((key) => displayNote(noteName(key, preferFlats), notation));
    return { voicing, names };
  }, [chord, notation, preferFlats]);
}
