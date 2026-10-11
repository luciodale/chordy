import { useEffect, useState } from 'react';
import type { Notation } from '@/lib/chords/notes';

export const FONT_STEPS = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'] as const;

const DEFAULT_FONT_STEP = 2;
const STORAGE_KEY = 'chordy:device';

type DevicePrefs = { fontStep: number; notation: Notation };

function load(): DevicePrefs | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: Partial<DevicePrefs> = JSON.parse(raw);
    return {
      fontStep: Math.min(FONT_STEPS.length - 1, Math.max(0, Number(parsed.fontStep ?? DEFAULT_FONT_STEP))),
      notation: parsed.notation === 'italian' ? 'italian' : 'english',
    };
  } catch {
    return null;
  }
}

function save(prefs: DevicePrefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode: preferences simply do not persist.
  }
}

// Font size and notation belong to the device (phone vs desktop), not the song.
export function useDevicePrefs() {
  const [prefs, setPrefs] = useState<DevicePrefs>({ fontStep: DEFAULT_FONT_STEP, notation: 'english' });

  // localStorage is unavailable during SSR, so stored prefs load after hydration.
  useEffect(() => {
    const stored = load();
    if (stored) setPrefs(stored);
  }, []);

  function update(patch: Partial<DevicePrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    save(next);
  }

  return {
    fontClass: FONT_STEPS[prefs.fontStep] ?? 'text-lg',
    notation: prefs.notation,
    canShrink: prefs.fontStep > 0,
    canGrow: prefs.fontStep < FONT_STEPS.length - 1,
    handleShrink: () => update({ fontStep: Math.max(0, prefs.fontStep - 1) }),
    handleGrow: () => update({ fontStep: Math.min(FONT_STEPS.length - 1, prefs.fontStep + 1) }),
    handleToggleNotation: () => update({ notation: prefs.notation === 'english' ? 'italian' : 'english' }),
  };
}
