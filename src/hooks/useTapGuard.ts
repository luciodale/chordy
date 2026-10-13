import { useRef } from 'react';

// Fingers drift a little on a tap; anything further is a scroll or a drag.
const TAP_SLOP = 10;

type Point = { x: number; y: number };

// Tells a deliberate tap from the end of a scroll gesture.
export function useTapGuard() {
  const start = useRef<Point | null>(null);

  return {
    handlePointerDown: (event: React.PointerEvent) => {
      start.current = { x: event.clientX, y: event.clientY };
    },
    isTap: (end: Point) => {
      const from = start.current;
      if (!from) return true;
      return Math.hypot(end.x - from.x, end.y - from.y) <= TAP_SLOP;
    },
  };
}
