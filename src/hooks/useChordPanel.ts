import { useState } from 'react';
import type { ChordView } from '@/lib/chords/render';

export function useChordPanel() {
  const [selected, setSelected] = useState<ChordView | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  return {
    selected,
    controlsVisible,
    handleChordTap: (chord: ChordView) => setSelected(chord),
    handleClosePanel: () => setSelected(null),
    // Tapping the sheet itself hides the controls for a clean stage view.
    handleSheetTap: () => setControlsVisible(!controlsVisible),
  };
}
