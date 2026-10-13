import type { ReactNode } from 'react';

export function ButtonGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center rounded-xl bg-stone-100 dark:bg-stone-800/60">{children}</div>;
}
