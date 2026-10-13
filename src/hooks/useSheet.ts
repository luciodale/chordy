import { useMemo } from 'react';
import { groupBlocks } from '@/lib/chords/blocks';
import { parseChord } from '@/lib/chords/chord';
import { firstChord, parseChordPro } from '@/lib/chords/chordpro';
import { fillRepeatedSections } from '@/lib/chords/repeat';
import { prefersFlats } from '@/lib/chords/key';
import type { Notation } from '@/lib/chords/notes';
import { renderSheet, transformChord } from '@/lib/chords/render';

type SheetOptions = {
  body: string;
  songKey: string | null;
  transpose: number;
  simplify: boolean;
  notation: Notation;
};

export function useSheet({ body, songKey, transpose, simplify, notation }: SheetOptions) {
  return useMemo(() => {
    const sheet = fillRepeatedSections(parseChordPro(body));
    const keyToken = songKey ?? sheet.meta.key ?? firstChord(sheet);
    const keyChord = keyToken ? parseChord(keyToken) : null;
    const options = {
      transpose,
      simplify,
      notation,
      preferFlats: keyChord ? prefersFlats(keyChord, transpose) : false,
    };
    return {
      blocks: groupBlocks(renderSheet(sheet, options)),
      displayKey: keyToken && keyChord ? transformChord(keyToken, { ...options, simplify: true }).label : null,
      preferFlats: options.preferFlats,
      // Spelling of the untransposed key, used when writing chords back.
      sourcePreferFlats: keyChord ? prefersFlats(keyChord, 0) : false,
    };
  }, [body, songKey, transpose, simplify, notation]);
}
