import { useLayoutEffect, useRef } from 'react';

// Floating chords take no width, so one sitting on the last word of a wrapped
// row can stick out past the right edge. Where rows break is only known after
// layout: measure, and let each offending chord take its own width, which
// wraps its word onto the next row.
export function useFitChords(content: unknown, fontClass: string) {
  const ref = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: content and font size are the triggers to re-measure, not values read inside
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    let lastWidth = -1;

    function fitChords() {
      if (!root) return;
      const floats = root.querySelectorAll<HTMLElement>('[data-float]');
      for (const element of floats) delete element.dataset.fit;
      const edge = root.getBoundingClientRect().right;
      // In document order: fixing one chord reflows everything after it.
      for (const element of floats) {
        const chord = element.firstElementChild?.getBoundingClientRect();
        if (chord && chord.right > edge + 0.5) element.dataset.fit = '';
      }
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (width === lastWidth) return;
      lastWidth = width;
      fitChords();
    });
    observer.observe(root);
    fitChords();
    return () => observer.disconnect();
  }, [content, fontClass]);

  return ref;
}
