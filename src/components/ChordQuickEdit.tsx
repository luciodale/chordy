import { Check, Trash2, X } from 'lucide-react';
import type { QuickEdit } from '@/hooks/useChordQuickEdit';

type ChordQuickEditProps = { edit: QuickEdit };

export function ChordQuickEdit({ edit }: ChordQuickEditProps) {
  const { target } = edit;
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-30">
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={edit.handleClose} />
      <div
        style={target.style}
        className="absolute flex w-64 -translate-x-1/2 flex-col gap-2 rounded-xl border border-stone-200 bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-stone-900"
      >
        {target.editable ? (
          <form onSubmit={edit.handleSave} className="flex items-center gap-1">
            <input
              // biome-ignore lint/a11y/noAutofocus: the popover exists to type a chord
              autoFocus
              value={edit.draft}
              onChange={(event) => edit.handleDraftChange(event.target.value)}
              onFocus={(event) => event.target.select()}
              onKeyDown={(event) => event.key === 'Escape' && edit.handleClose()}
              aria-label="Chord"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1.5 font-sheet font-bold outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950"
            />
            <button
              type="submit"
              aria-label="Save chord"
              disabled={edit.saving}
              className="rounded-lg bg-amber-500 p-2 text-stone-950 disabled:opacity-50"
            >
              <Check className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Remove chord"
              disabled={edit.saving}
              onClick={edit.handleRemove}
              className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
            >
              <Trash2 className="size-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm text-stone-600 dark:text-stone-300">
              <span className="font-sheet font-bold">{target.label}</span> is borrowed from an earlier section; edit it
              there.
            </p>
            <button
              type="button"
              aria-label="Close"
              onClick={edit.handleClose}
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        {edit.error && <p className="px-1 text-sm text-red-600">{edit.error}</p>}
      </div>
    </div>
  );
}
