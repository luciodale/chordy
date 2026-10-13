import { RotateCw } from 'lucide-react';
import { IconButton } from './IconButton';

function handleReload() {
  window.location.reload();
}

// Only shown in the installed app, where there is no browser reload button.
export function ReloadButton() {
  return (
    <span className="hidden standalone:flex">
      <IconButton label="Reload" onClick={handleReload}>
        <RotateCw className="size-5" />
      </IconButton>
    </span>
  );
}
