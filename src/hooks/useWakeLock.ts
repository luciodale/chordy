import { useEffect } from 'react';

// Keeps the screen on while a sheet is open. The lock is dropped by the
// browser whenever the tab hides, so it is re-requested on return.
export function useWakeLock() {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;

    async function acquire() {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // Denied (battery saver, unsupported context): the sheet still works.
      }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') acquire();
    }

    acquire();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      sentinel?.release().catch(() => {});
    };
  }, []);
}
