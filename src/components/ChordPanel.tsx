import { X } from 'lucide-react';
import { useChordDetail } from '@/hooks/useChordDetail';
import type { Notation } from '@/lib/chords/notes';
import type { ChordView } from '@/lib/chords/render';
import { PianoKeyboard } from './PianoKeyboard';

type ChordPanelProps = {
  chord: ChordView;
  notation: Notation;
  preferFlats: boolean;
  onClose: () => void;
};

export function ChordPanel({ chord, notation, preferFlats, onClose }: ChordPanelProps) {
  const detail = useChordDetail(chord, notation, preferFlats);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-stone-950/40" onClick={onClose} />
      <div className="relative flex w-full max-w-lg flex-col items-center gap-3 rounded-t-2xl bg-white p-5 pb-8 shadow-xl dark:bg-stone-900">
        <div className="flex w-full items-center justify-between">
          <span className="text-3xl font-bold text-amber-700 dark:text-amber-400">{chord.label}</span>
          <button
            type="button"
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-6" />
          </button>
        </div>
        {detail ? (
          <>
            <PianoKeyboard keys={detail.voicing.keys} octaves={detail.voicing.octaves} />
            <p className="text-lg tracking-wide text-stone-600 dark:text-stone-300">{detail.names.join(' · ')}</p>
          </>
        ) : (
          <p className="text-stone-500">Not a chord I can draw.</p>
        )}
      </div>
    </div>
  );
}
