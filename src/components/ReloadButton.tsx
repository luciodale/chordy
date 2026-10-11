import { RotateCw } from 'lucide-react';

function handleReload() {
  window.location.reload();
}

// Only shown in the installed app, where there is no browser reload button.
export function ReloadButton() {
  return (
    <button
      type="button"
      aria-label="Reload"
      title="Reload"
      onClick={handleReload}
      className="hidden rounded-lg p-2 text-stone-500 hover:bg-stone-200 standalone:flex dark:hover:bg-stone-800"
    >
      <RotateCw className="size-5" />
    </button>
  );
}
