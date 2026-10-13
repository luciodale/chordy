import clsx from 'clsx';
import { AArrowDown, AArrowUp, ChevronLeft, Minus, Pause, Play, Plus } from 'lucide-react';
import { ButtonGroup } from './ButtonGroup';
import { IconButton } from './IconButton';

type ControlsBarProps = {
  backHref: string;
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

export function ControlsBar(props: ControlsBarProps) {
  const offset = props.transpose > 0 ? `+${props.transpose}` : String(props.transpose);
  return (
    <div
      className={clsx(
        'fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur transition-transform dark:border-stone-800 dark:bg-stone-950/95',
        !props.visible && 'translate-y-full',
      )}
    >
      {/* Clears the home indicator on phones; Tailwind has no safe area token. */}
      <div className="mx-auto flex max-w-lg items-center justify-between gap-1 p-2 pb-[calc(--spacing(2)+env(safe-area-inset-bottom))]">
        <ButtonGroup>
          <IconButton label="Library" href={props.backHref}>
            <ChevronLeft className="size-5" />
          </IconButton>
        </ButtonGroup>

        <ButtonGroup>
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
        </ButtonGroup>

        <ButtonGroup>
          <IconButton label="Smaller text" onClick={props.onShrink} disabled={!props.canShrink}>
            <AArrowDown className="size-5" />
          </IconButton>
          <IconButton label="Larger text" onClick={props.onGrow} disabled={!props.canGrow}>
            <AArrowUp className="size-5" />
          </IconButton>
        </ButtonGroup>

        <ButtonGroup>
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
        </ButtonGroup>
      </div>
    </div>
  );
}
