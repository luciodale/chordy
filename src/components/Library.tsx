import { Check, Download, Loader2, Plus, Search } from 'lucide-react';
import { resultKey, useLibrarySearch } from '@/hooks/useLibrarySearch';
import type { SearchResult, SourceResults } from '@/lib/catalog';
import type { SongSummary } from '@/lib/songs';

type LibraryProps = { songs: SongSummary[] };

function SongRow({ song }: { song: SongSummary }) {
  return (
    <li>
      <a
        href={`/songs/${song.id}`}
        className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-stone-200 dark:hover:bg-stone-800"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{song.title}</span>
          <span className="truncate text-sm text-stone-500 dark:text-stone-400">{song.artist}</span>
        </span>
        {song.songKey && <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{song.songKey}</span>}
      </a>
    </li>
  );
}

type SourceSectionProps = {
  group: SourceResults;
  importingKey: string | null;
  onImport: (result: SearchResult) => void;
};

function SourceSection({ group, importingKey, onImport }: SourceSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
        {group.name} · {group.results.length}
      </h2>
      {group.error && <p className="px-3 text-sm text-red-600">Unavailable: {group.error}</p>}
      {!group.error && group.results.length === 0 && <p className="px-3 text-sm text-stone-500">No results.</p>}
      <ul className="flex flex-col">
        {group.results.map((result) => {
          const key = resultKey(result);
          const inLibrary = result.songId !== null;
          const importing = importingKey === key;
          return (
            <li key={key}>
              <button
                type="button"
                disabled={importingKey !== null}
                onClick={() => onImport(result)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-stone-200 disabled:opacity-60 dark:hover:bg-stone-800"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">{result.title}</span>
                  <span className="truncate text-sm text-stone-500 dark:text-stone-400">
                    {[result.artist, result.detail].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {inLibrary ? (
                  <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-600">
                    <Check className="size-4" />
                    In library
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {importing ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    {importing ? 'Adding' : 'Add'}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Library({ songs }: LibraryProps) {
  const search = useLibrarySearch(songs);
  const { remote } = search;
  const hasQuery = search.query.trim() !== '';

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chordy</h1>
        <a
          href="/songs/new"
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <Plus className="size-4" />
          Paste
        </a>
      </header>

      <label className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-3 focus-within:border-amber-500 dark:border-stone-700 dark:bg-stone-900">
        <Search className="size-5 text-stone-400" />
        <input
          type="search"
          placeholder="Search song or artist"
          value={search.query}
          onChange={(event) => search.handleQueryChange(event.target.value)}
          className="w-full bg-transparent text-lg outline-none"
        />
      </label>

      <section className="flex flex-col gap-2">
        <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Library · {search.localMatches.length}
        </h2>
        {search.localMatches.length === 0 ? (
          <p className="px-3 text-stone-500">{hasQuery ? 'Nothing in your library.' : 'No songs yet. Search to add one.'}</p>
        ) : (
          <ul className="flex flex-col">
            {search.localMatches.map((song) => (
              <SongRow key={song.id} song={song} />
            ))}
          </ul>
        )}
      </section>

      {remote.status === 'loading' && (
        <p className="flex items-center gap-2 px-3 text-sm text-stone-500">
          <Loader2 className="size-4 animate-spin" />
          Searching all sources
        </p>
      )}
      {remote.status === 'error' && <p className="px-3 text-red-600">{remote.message}</p>}
      {search.importError && <p className="px-3 text-red-600">{search.importError}</p>}
      {remote.status === 'done' &&
        remote.sources.map((group) => (
          <SourceSection
            key={group.source}
            group={group}
            importingKey={search.importingKey}
            onImport={search.handleImport}
          />
        ))}
    </div>
  );
}
