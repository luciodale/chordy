import { useState } from 'react';
import { type ChordSpot, replaceChord, sourceChordName, spotRange } from '@/lib/chords/spot';
import type { SongBody } from './useSongBody';

// A tapped chord with where it sits on screen, so the editor opens over it.
export type ChordTap = { spot: ChordSpot; label: string; rect: DOMRect };

type Target = { spot: ChordSpot; label: string; editable: boolean; style: React.CSSProperties };

type QuickEditOptions = {
  songBody: SongBody;
  transpose: number;
  sourcePreferFlats: boolean;
  onOpen: () => void;
};

// Half the popover width (w-64) plus a small gutter.
const HALF_WIDTH = '8.5rem';

// Anchors the popover under the chord, or above it in the lower half of the
// screen, horizontally centred on it but kept inside the viewport.
function placeOver(rect: DOMRect): React.CSSProperties {
  const center = rect.left + rect.width / 2;
  const left = `clamp(${HALF_WIDTH}, ${center}px, calc(100vw - ${HALF_WIDTH}))`;
  return rect.top > window.innerHeight / 2
    ? { left, bottom: window.innerHeight - rect.top + 8 }
    : { left, top: rect.bottom + 8 };
}

export function useChordQuickEdit({ songBody, transpose, sourcePreferFlats, onOpen }: QuickEditOptions) {
  const [target, setTarget] = useState<Target | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function close() {
    setTarget(null);
    setError(null);
  }

  async function write(name: string | null) {
    if (!target) return;
    const next = replaceChord(songBody.body, target.spot, name);
    if (next === null) return;
    setSaving(true);
    const saved = await songBody.save(next);
    setSaving(false);
    if (saved) close();
    else setError('Could not save the change');
  }

  return {
    target,
    draft,
    error,
    saving,
    handleChordTap: (tap: ChordTap) => {
      onOpen();
      setTarget({
        spot: tap.spot,
        label: tap.label,
        editable: spotRange(songBody.body, tap.spot) !== null,
        style: placeOver(tap.rect),
      });
      setDraft(tap.label);
      setError(null);
    },
    handleDraftChange: (value: string) => {
      setDraft(value);
      setError(null);
    },
    handleSave: (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const name = sourceChordName(draft, transpose, sourcePreferFlats);
      if (!name) {
        setError('Not a chord');
        return;
      }
      write(name);
    },
    handleRemove: () => write(null),
    handleClose: close,
  };
}

export type QuickEdit = ReturnType<typeof useChordQuickEdit>;
