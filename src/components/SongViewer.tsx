import clsx from 'clsx';
import { ChevronLeft, ListTree, Pencil } from 'lucide-react';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useChordPanel } from '@/hooks/useChordPanel';
import { useDevicePrefs } from '@/hooks/useDevicePrefs';
import { useSectionEditor } from '@/hooks/useSectionEditor';
import { useSheet } from '@/hooks/useSheet';
import { MAX_SPEED, MIN_SPEED, useSongPrefs } from '@/hooks/useSongPrefs';
import { useWakeLock } from '@/hooks/useWakeLock';
import type { SongPrefs } from '@/lib/songs';
import { ChordPanel } from './ChordPanel';
import { ControlsBar } from './ControlsBar';
import { ReloadButton } from './ReloadButton';
import { SectionsBar } from './SectionsBar';
import { SheetView } from './SheetView';

export type ViewerSong = SongPrefs & {
  id: number;
  title: string;
  artist: string;
  songKey: string | null;
  body: string;
  sourceUrl: string | null;
};

type SongViewerProps = { song: ViewerSong };

const PILL =
  'rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm font-semibold text-stone-600 dark:border-stone-700 dark:text-stone-300';
const PILL_ACTIVE = 'border-amber-500 bg-amber-500 text-stone-950 dark:text-stone-950';

export function SongViewer({ song }: SongViewerProps) {
  const device = useDevicePrefs();
  const songPrefs = useSongPrefs(song.id, song);
  const { prefs } = songPrefs;
  const sections = useSectionEditor(song);
  const sheet = useSheet({ ...song, ...prefs, body: sections.body, notation: device.notation });
  const scroll = useAutoScroll(prefs.scrollSpeed);
  const panel = useChordPanel();
  useWakeLock();

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-40">
      <header className="flex items-center gap-2">
        <a href="/" aria-label="Library" className="-ml-2 rounded-lg p-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800">
          <ChevronLeft className="size-6" />
        </a>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-xl font-bold">{song.title}</h1>
          <p className="truncate text-stone-500 dark:text-stone-400">{song.artist}</p>
        </div>
        <button
          type="button"
          onClick={songPrefs.handleToggleSimplify}
          className={clsx(PILL, prefs.simplify && PILL_ACTIVE)}
        >
          Easy
        </button>
        <button type="button" onClick={device.handleToggleNotation} className={PILL}>
          {device.notation === 'italian' ? 'Do' : 'C'}
        </button>
        <button
          type="button"
          aria-label="Sections"
          title="Sections"
          onClick={sections.handleToggleEditing}
          className={clsx(PILL, sections.editing && PILL_ACTIVE)}
        >
          <ListTree className="size-4" />
        </button>
        <a
          href={`/songs/${song.id}/edit`}
          aria-label="Edit"
          className="rounded-lg p-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
        >
          <Pencil className="size-5" />
        </a>
        <ReloadButton />
      </header>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: tapping the sheet hides the bar on touch screens; every control stays reachable by keyboard */}
      <main onClick={panel.handleSheetTap}>
        <SheetView
          blocks={sheet.blocks}
          fontClass={device.fontClass}
          onChordTap={panel.handleChordTap}
          sections={
            sections.editing
              ? {
                  placing: sections.placing,
                  onPickLabel: sections.handlePickLabel,
                  onRemoveLabel: sections.handleRemoveLabel,
                  onPlace: sections.handlePlace,
                }
              : undefined
          }
        />
      </main>

      {song.sourceUrl && (
        <a href={song.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-stone-400 underline">
          Source
        </a>
      )}

      {sections.editing && (
        <SectionsBar
          placing={sections.placing}
          error={sections.error}
          onNewLabel={sections.handleNewLabel}
          onCancelPlacing={sections.handleCancelPlacing}
          onDone={sections.handleToggleEditing}
        />
      )}

      {!sections.editing && (
      <ControlsBar
        visible={panel.controlsVisible}
        transpose={prefs.transpose}
        displayKey={sheet.displayKey}
        scrollSpeed={prefs.scrollSpeed}
        isScrolling={scroll.isScrolling}
        canShrink={device.canShrink}
        canGrow={device.canGrow}
        canSlower={prefs.scrollSpeed > MIN_SPEED}
        canFaster={prefs.scrollSpeed < MAX_SPEED}
        onTransposeDown={songPrefs.handleTransposeDown}
        onTransposeUp={songPrefs.handleTransposeUp}
        onTransposeReset={songPrefs.handleTransposeReset}
        onShrink={device.handleShrink}
        onGrow={device.handleGrow}
        onToggleScroll={scroll.handleToggleScroll}
        onSlower={songPrefs.handleSlower}
        onFaster={songPrefs.handleFaster}
      />
      )}

      {panel.selected && (
        <ChordPanel
          chord={panel.selected}
          notation={device.notation}
          preferFlats={sheet.preferFlats}
          onClose={panel.handleClosePanel}
        />
      )}
    </div>
  );
}
