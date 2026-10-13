import { ChevronLeft, RefreshCw, Trash2 } from 'lucide-react';
import { type EditorInitial, useSongEditor } from '@/hooks/useSongEditor';

type SongEditorProps = { initial: EditorInitial };

const INPUT =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-900';

export function SongEditor({ initial }: SongEditorProps) {
  const editor = useSongEditor(initial);
  const back = initial.id ? `/songs/${initial.id}` : '/';

  return (
    <form onSubmit={editor.handleSave} className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-4 py-4">
      <header className="flex items-center gap-2">
        <a href={back} aria-label="Back" className="-ml-2 rounded-lg p-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800">
          <ChevronLeft className="size-6" />
        </a>
        <h1 className="flex-1 text-xl font-bold">{editor.isNew ? 'New song' : 'Edit song'}</h1>
        {editor.canRefresh && (
          <button
            type="button"
            onClick={editor.handleRefresh}
            disabled={editor.saving}
            aria-label="Refresh from source"
            title="Refresh from source"
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
          >
            <RefreshCw className="size-5" />
          </button>
        )}
        {!editor.isNew && (
          <button
            type="button"
            onClick={editor.handleDelete}
            aria-label="Delete"
            className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="size-5" />
          </button>
        )}
        <button
          type="submit"
          disabled={editor.saving}
          className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-stone-950 disabled:opacity-50"
        >
          {editor.saving ? 'Saving' : 'Save'}
        </button>
      </header>

      {editor.error && <p className="text-red-600">{editor.error}</p>}

      <div className="grid gap-3 md:grid-cols-3">
        <input
          required
          placeholder="Title"
          value={editor.fields.title}
          onChange={(event) => editor.handleChange('title', event.target.value)}
          className={INPUT}
        />
        <input
          placeholder="Artist"
          value={editor.fields.artist}
          onChange={(event) => editor.handleChange('artist', event.target.value)}
          className={INPUT}
        />
        <input
          placeholder="Key (e.g. C, Am)"
          value={editor.fields.songKey ?? ''}
          onChange={(event) => editor.handleChange('songKey', event.target.value)}
          className={INPUT}
        />
      </div>

      <textarea
        required
        spellCheck={false}
        placeholder="Paste a sheet: chords over lyrics (C or Do notation) or ChordPro"
        value={editor.fields.body}
        onChange={(event) => editor.handleChange('body', event.target.value)}
        className={`${INPUT} flex-1 font-mono text-sm`}
      />
    </form>
  );
}
