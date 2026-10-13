import { useState } from 'react';
import type { SheetBlock } from '@/lib/chords/blocks';
import { insertLabel, moveLine, removeLine } from '@/lib/chords/sections';
import type { SongBody } from './useSongBody';

// What a tap on a line does next: nothing, or drop a label before that line.
export type Placing = { text: string; from: number | null } | null;

export function useSectionEditor({ body, error, save }: SongBody) {
  const [editing, setEditing] = useState(false);
  const [placing, setPlacing] = useState<Placing>(null);

  return {
    editing,
    placing,
    error,
    handleToggleEditing: () => {
      setEditing(!editing);
      setPlacing(null);
    },
    handleNewLabel: (text: string) => setPlacing({ text, from: null }),
    handlePickLabel: (block: SheetBlock) => {
      if (block.label === null || block.labelSource === null) return;
      const same = placing?.from === block.labelSource;
      setPlacing(same ? null : { text: block.label, from: block.labelSource });
    },
    handleRemoveLabel: (block: SheetBlock) => {
      if (block.labelSource === null) return;
      setPlacing(null);
      save(removeLine(body, block.labelSource));
    },
    handlePlace: (before: number) => {
      if (!placing) return;
      const next =
        placing.from === null ? insertLabel(body, placing.text, before) : moveLine(body, placing.from, before);
      setPlacing(null);
      save(next);
    },
    handleCancelPlacing: () => setPlacing(null),
  };
}
