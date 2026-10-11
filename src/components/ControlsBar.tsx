import clsx from 'clsx';
import { AArrowDown, AArrowUp, Minus, Pause, Play, Plus } from 'lucide-react';
import { IconButton } from './IconButton';

type ControlsBarProps = {
  visible: boolean;
  transpose: number;
  displayKey: string | null;
  scrollSpeed: number;
  isScrolling: boolean;
  canShrink: boolean;
  canGrow: boolean;
  canSlower: boolean;
  canFaster: boolean;
  onTransposeDown: () => void;
  onTransposeUp: () => void;
  onTransposeReset: () => void;
  onShrink: () => void;
  onGrow: () => void;
  onToggleScroll: () => void;
  onSlower: () => void;
  onFaster: () => void;
};

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center rounded-xl bg-stone-100 dark:bg-stone-800/60">{children}</div>;
}

export function ControlsBar(props: ControlsBarProps) {
  const offset = props.transpose > 0 ? `+${props.transpose}` : String(props.transpose);
  return (
    <div
      className={clsx(
        'fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur transition-transform dark:border-stone-800 dark:bg-stone-950/95',
        !props.visible && 'translate-y-full',
      )}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-1 p-2">
        <Group>
          <IconButton label="Transpose down" onClick={props.onTransposeDown}>
            <Minus className="size-5" />
          </IconButton>
          <IconButton label="Reset key" onClick={props.onTransposeReset} active={props.transpose !== 0}>
            <span className="flex flex-col items-center leading-none">
              <span>{props.displayKey ?? 'Key'}</span>
              <span className="text-xs font-normal">{props.transpose === 0 ? 'orig' : offset}</span>
            </span>
          </IconButton>
          <IconButton label="Transpose up" onClick={props.onTransposeUp}>
            <Plus className="size-5" />
          </IconButton>
        </Group>

        <Group>
          <IconButton label="Smaller text" onClick={props.onShrink} disabled={!props.canShrink}>
            <AArrowDown className="size-5" />
          </IconButton>
          <IconButton label="Larger text" onClick={props.onGrow} disabled={!props.canGrow}>
            <AArrowUp className="size-5" />
          </IconButton>
        </Group>

        <Group>
          <IconButton label="Slower" onClick={props.onSlower} disabled={!props.canSlower}>
            <Minus className="size-5" />
          </IconButton>
          <IconButton label={props.isScrolling ? 'Pause scroll' : 'Start scroll'} onClick={props.onToggleScroll} active={props.isScrolling}>
            <span className="flex items-center gap-1">
              {props.isScrolling ? <Pause className="size-5" /> : <Play className="size-5" />}
              <span>{props.scrollSpeed}</span>
            </span>
          </IconButton>
          <IconButton label="Faster" onClick={props.onFaster} disabled={!props.canFaster}>
            <Plus className="size-5" />
          </IconButton>
        </Group>
      </div>
    </div>
  );
}
