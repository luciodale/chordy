import { useState } from 'react';

export function useStageControls() {
  const [controlsVisible, setControlsVisible] = useState(true);

  return {
    controlsVisible,
    // Tapping the sheet itself hides the controls for a clean stage view.
    handleSheetTap: () => setControlsVisible(!controlsVisible),
  };
}
