import clsx from 'clsx';
import type { ReactNode } from 'react';

type IconButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
};

export function IconButton({ label, onClick, disabled, active, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'flex min-w-9 items-center justify-center rounded-lg p-1.5 text-sm font-semibold transition-colors disabled:opacity-30',
        active
          ? 'bg-amber-500 text-stone-950'
          : 'text-stone-700 hover:bg-stone-200 dark:text-stone-200 dark:hover:bg-stone-800',
      )}
    >
      {children}
    </button>
  );
}
