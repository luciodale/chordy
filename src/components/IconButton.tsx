import clsx from 'clsx';
import type { ReactNode } from 'react';

// One look for every viewer control, top bar and bottom bar alike: either an
// action (`onClick`) or a link (`href`).
type IconButtonProps = {
  label: string;
  active?: boolean;
  children: ReactNode;
} & ({ onClick: () => void; disabled?: boolean; href?: never } | { href: string; onClick?: never; disabled?: never });

export function IconButton({ label, active, children, ...action }: IconButtonProps) {
  const className = clsx(
    'flex min-h-9 min-w-9 items-center justify-center rounded-lg px-2 py-1 text-sm font-semibold transition-colors disabled:opacity-30',
    active
      ? 'bg-amber-500 text-stone-950'
      : 'text-stone-700 hover:bg-stone-200 dark:text-stone-200 dark:hover:bg-stone-800',
  );
  if (action.href !== undefined) {
    return (
      <a href={action.href} aria-label={label} title={label} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={action.disabled}
      onClick={action.onClick}
      className={className}
    >
      {children}
    </button>
  );
}
