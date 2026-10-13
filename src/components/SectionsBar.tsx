import { Check, X } from 'lucide-react';
import type { Placing } from '@/hooks/useSectionEditor';
import { SECTION_LABELS } from '@/lib/chords/sections';

type SectionsBarProps = {
  placing: Placing;
  error: string | null;
  onNewLabel: (text: string) => void;
  onCancelPlacing: () => void;
  onDone: () => void;
};

export function SectionsBar({ placing, error, onNewLabel, onCancelPlacing, onDone }: SectionsBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      <div className="mx-auto flex max-w-md flex-col gap-2 p-3 pb-[calc(--spacing(3)+env(safe-area-inset-bottom))]">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {placing ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm">
              Tap <span className="font-semibold text-amber-700 dark:text-amber-400">here</span> on the line where{' '}
              <span className="font-bold">{placing.text}</span> starts
            </p>
            <button
              type="button"
              onClick={onCancelPlacing}
              aria-label="Cancel"
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
            >
              <X className="size-5" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Add a label, or tap an existing one to move it.
            </p>
            <div className="flex flex-wrap gap-2">
              {SECTION_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onNewLabel(label)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-semibold dark:border-stone-700"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={onDone}
                className="ml-auto flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-stone-950"
              >
                <Check className="size-4" />
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
