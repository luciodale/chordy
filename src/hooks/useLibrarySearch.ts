import { useMemo, useRef, useState } from 'react';
import { filterSongs, type SearchResult, type SourceResults } from '@/lib/catalog';
import type { SongSummary } from '@/lib/songs';

type RemoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; sources: SourceResults[] }
  | { status: 'error'; message: string };

const MIN_REMOTE_QUERY = 3;
const DEBOUNCE_MS = 350;

type ErrorBody = { error?: string };

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  return body.error ?? `request failed (${response.status})`;
}

export function resultKey(result: SearchResult): string {
  return `${result.source}:${result.sourceId}`;
}

export function useLibrarySearch(songs: SongSummary[]) {
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState<RemoteState>({ status: 'idle' });
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(0);

  const localMatches = useMemo(() => filterSongs(songs, query), [songs, query]);

  async function searchRemote(value: string) {
    const request = ++latest.current;
    setRemote({ status: 'loading' });
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      if (request !== latest.current) return;
      if (!response.ok) {
        setRemote({ status: 'error', message: await readError(response) });
        return;
      }
      const body: { sources: SourceResults[] } = await response.json();
      if (request === latest.current) setRemote({ status: 'done', sources: body.sources });
    } catch {
      if (request === latest.current) setRemote({ status: 'error', message: 'Network error' });
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setImportError(null);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < MIN_REMOTE_QUERY) {
      latest.current += 1;
      setRemote({ status: 'idle' });
      return;
    }
    timer.current = setTimeout(() => searchRemote(value.trim()), DEBOUNCE_MS);
  }

  async function handleImport(result: SearchResult) {
    if (result.songId !== null) {
      window.location.assign(`/songs/${result.songId}`);
      return;
    }
    setImportingKey(resultKey(result));
    setImportError(null);
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: result.source, sourceId: result.sourceId }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const body: { id: number } = await response.json();
      window.location.assign(`/songs/${body.id}`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
      setImportingKey(null);
    }
  }

  return { query, localMatches, remote, importingKey, importError, handleQueryChange, handleImport };
}
