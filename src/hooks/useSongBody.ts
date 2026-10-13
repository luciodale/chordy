import { useState } from 'react';

type SongText = { id: number; title: string; artist: string; songKey: string | null; body: string };

// The sheet text as edited in place from the viewer, saved optimistically.
export function useSongBody(song: SongText) {
  const [body, setBody] = useState(song.body);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string) {
    if (next === body) return true;
    const previous = body;
    setBody(next);
    setError(null);
    const response = await fetch(`/api/songs/${song.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: song.title, artist: song.artist, songKey: song.songKey, body: next }),
    }).catch(() => null);
    if (response?.ok) return true;
    setBody(previous);
    setError('Could not save the change');
    return false;
  }

  return { body, error, save };
}

export type SongBody = ReturnType<typeof useSongBody>;
