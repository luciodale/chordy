import { useEffect, useRef, useState } from 'react';

// Pixels per second for speed levels 1..10.
const SPEEDS = [8, 12, 17, 23, 30, 38, 48, 60, 75, 95];

function atBottom(): boolean {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
}

export function useAutoScroll(speed: number) {
  const [isScrolling, setIsScrolling] = useState(false);
  const frame = useRef<number | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  function stop() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setIsScrolling(false);
  }

  function start() {
    if (atBottom()) window.scrollTo({ top: 0 });
    let last = performance.now();
    let carry = 0;

    function step(now: number) {
      carry += ((SPEEDS[speedRef.current - 1] ?? 30) * (now - last)) / 1000;
      last = now;
      // Whole pixels only: fractional scrollBy is rounded away on many devices.
      const pixels = Math.floor(carry);
      if (pixels > 0) {
        window.scrollBy(0, pixels);
        carry -= pixels;
      }
      if (atBottom()) {
        stop();
        return;
      }
      frame.current = requestAnimationFrame(step);
    }

    frame.current = requestAnimationFrame(step);
    setIsScrolling(true);
  }

  // Stop the loop if the viewer unmounts mid scroll.
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return { isScrolling, handleStop: stop, handleToggleScroll: () => (isScrolling ? stop() : start()) };
}
