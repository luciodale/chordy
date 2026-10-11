import { useMemo, useState } from 'react';
import { groupBlocks } from '@/lib/chords/blocks';
import { parseChordPro } from '@/lib/chords/chordpro';
import { textToChordPro } from '@/lib/chords/importText';
import { renderSheet } from '@/lib/chords/render';
import type { SongFields } from '@/lib/songs';

export type EditorInitial = SongFields & { id: number | null; hasSource: boolean };

const PREVIEW_OPTIONS = { transpose: 0, simplify: false, notation: 'english', preferFlats: false } as const;

export function useSongEditor(initial: EditorInitial) {
  const [fields, setFields] = useState<SongFields>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(
    () => groupBlocks(renderSheet(parseChordPro(textToChordPro(fields.body)), PREVIEW_OPTIONS)),
    [fields.body],
  );

  function handleChange(field: keyof SongFields, value: string) {
    setFields({ ...fields, [field]: value });
  }

  async function handleSave(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(initial.id ? `/api/songs/${initial.id}` : '/api/songs', {
        method: initial.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const body: { id?: number; error?: string } = await response.json();
      if (!response.ok || !body.id) throw new Error(body.error ?? 'Save failed');
      window.location.assign(`/songs/${body.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Save failed');
      setSaving(false);
    }
  }

  async function handleRefresh() {
    if (!initial.id || !window.confirm('Replace the sheet with a fresh copy from the source?')) return;
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/songs/${initial.id}/refresh`, { method: 'POST' });
    if (response.ok) {
      window.location.assign(`/songs/${initial.id}`);
      return;
    }
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setError(body.error ?? 'Refresh failed');
    setSaving(false);
  }

  async function handleDelete() {
    if (!initial.id || !window.confirm(`Delete "${initial.title}"?`)) return;
    await fetch(`/api/songs/${initial.id}`, { method: 'DELETE' });
    window.location.assign('/');
  }

  return { fields, preview, saving, error, isNew: initial.id === null, canRefresh: initial.hasSource, handleChange, handleSave, handleRefresh, handleDelete };
}
