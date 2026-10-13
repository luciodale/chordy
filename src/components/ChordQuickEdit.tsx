import { Check } from 'lucide-react';
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
        className="absolute flex w-56 -translate-x-1/2 flex-col gap-1 rounded-2xl bg-white/95 p-1.5 shadow-lg ring-1 ring-stone-950/5 backdrop-blur dark:bg-stone-900/95 dark:ring-white/10"
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
              className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 font-sheet text-lg font-bold outline-none"
            />
            <button
              type="submit"
              aria-label="Save chord"
              disabled={edit.saving}
              className="rounded-xl bg-amber-500 p-2 text-stone-950 transition-opacity disabled:opacity-50"
            >
              <Check className="size-4" />
            </button>
          </form>
        ) : (
          <p className="px-2.5 py-1.5 text-sm text-stone-500 dark:text-stone-400">
            <span className="font-sheet font-bold text-stone-900 dark:text-stone-100">{target.label}</span> is borrowed;
            edit it in its original section.
          </p>
        )}
        {edit.error && <p className="px-2.5 pb-1 text-xs text-red-600">{edit.error}</p>}
      </div>
    </div>
  );
}
