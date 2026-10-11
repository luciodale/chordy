import { useRef, useState } from 'react';
import type { SongPrefs } from '@/lib/songs';

const SAVE_DELAY_MS = 600;
export const MIN_SPEED = 1;
export const MAX_SPEED = 10;

// Keeps the offset in -5..+6 so the shortest way to the target key is used.
function wrapTranspose(value: number): number {
  return ((((value + 5) % 12) + 12) % 12) - 5;
}

export function useSongPrefs(songId: number, initial: SongPrefs) {
  const [prefs, setPrefs] = useState(initial);
  const pending = useRef<Partial<SongPrefs>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flush() {
    const body = pending.current;
    pending.current = {};
    fetch(`/api/songs/${songId}/prefs`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Losing a preference write is harmless; the next change retries.
    });
  }

  function change(patch: Partial<SongPrefs>) {
    setPrefs({ ...prefs, ...patch });
    pending.current = { ...pending.current, ...patch };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  }

  return {
    prefs,
    handleTransposeDown: () => change({ transpose: wrapTranspose(prefs.transpose - 1) }),
    handleTransposeUp: () => change({ transpose: wrapTranspose(prefs.transpose + 1) }),
    handleTransposeReset: () => change({ transpose: 0 }),
    handleToggleSimplify: () => change({ simplify: !prefs.simplify }),
    handleSlower: () => change({ scrollSpeed: Math.max(MIN_SPEED, prefs.scrollSpeed - 1) }),
    handleFaster: () => change({ scrollSpeed: Math.min(MAX_SPEED, prefs.scrollSpeed + 1) }),
  };
}
