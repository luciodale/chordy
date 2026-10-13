import { useState } from 'react';
import type { SongFields } from '@/lib/songs';

export type EditorInitial = SongFields & { id: number | null };

export function useSongEditor(initial: EditorInitial) {
  const [fields, setFields] = useState<SongFields>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!initial.id || !window.confirm(`Delete "${initial.title}"?`)) return;
    await fetch(`/api/songs/${initial.id}`, { method: 'DELETE' });
    window.location.assign('/');
  }

  return { fields, saving, error, isNew: initial.id === null, handleChange, handleSave, handleDelete };
}
