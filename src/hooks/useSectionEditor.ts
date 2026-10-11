import { useState } from 'react';
import type { SheetBlock } from '@/lib/chords/blocks';
import { insertLabel, moveLine, removeLine } from '@/lib/chords/sections';

type SongText = { id: number; title: string; artist: string; songKey: string | null; body: string };

// What a tap on a line does next: nothing, or drop a label before that line.
export type Placing = { text: string; from: number | null } | null;

export function useSectionEditor(song: SongText) {
  const [body, setBody] = useState(song.body);
  const [editing, setEditing] = useState(false);
  const [placing, setPlacing] = useState<Placing>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string) {
    if (next === body) return;
    const previous = body;
    setBody(next);
    setError(null);
    const response = await fetch(`/api/songs/${song.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: song.title, artist: song.artist, songKey: song.songKey, body: next }),
    }).catch(() => null);
    if (!response?.ok) {
      setBody(previous);
      setError('Could not save the change');
    }
  }

  return {
    body,
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
