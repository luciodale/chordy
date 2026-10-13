import { ChevronLeft, ListTree, Pencil } from 'lucide-react';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useDevicePrefs } from '@/hooks/useDevicePrefs';
import { useChordQuickEdit } from '@/hooks/useChordQuickEdit';
import { useSectionEditor } from '@/hooks/useSectionEditor';
import { useSheet } from '@/hooks/useSheet';
import { useSongBody } from '@/hooks/useSongBody';
import { MAX_SPEED, MIN_SPEED, useSongPrefs } from '@/hooks/useSongPrefs';
import { useStageControls } from '@/hooks/useStageControls';
import { useWakeLock } from '@/hooks/useWakeLock';
import type { SongPrefs } from '@/lib/songs';
import { ChordQuickEdit } from './ChordQuickEdit';
import { ButtonGroup } from './ButtonGroup';
import { ControlsBar } from './ControlsBar';
import { IconButton } from './IconButton';
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

export function SongViewer({ song }: SongViewerProps) {
  const device = useDevicePrefs();
  const songPrefs = useSongPrefs(song.id, song);
  const { prefs } = songPrefs;
  const songBody = useSongBody(song);
  const sections = useSectionEditor(songBody);
  const sheet = useSheet({ ...song, ...prefs, body: songBody.body, notation: device.notation });
  const scroll = useAutoScroll(prefs.scrollSpeed);
  const stage = useStageControls();
  const quickEdit = useChordQuickEdit({
    songBody,
    transpose: prefs.transpose,
    sourcePreferFlats: sheet.sourcePreferFlats,
    onOpen: scroll.handleStop,
  });
  useWakeLock();

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-40">
      <header className="flex items-center gap-2">
        <ButtonGroup>
          <IconButton label="Library" href="/">
            <ChevronLeft className="size-5" />
          </IconButton>
        </ButtonGroup>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-xl font-bold">{song.title}</h1>
          <p className="truncate text-stone-500 dark:text-stone-400">{song.artist}</p>
        </div>
        <ButtonGroup>
          <IconButton label="Easy chords" onClick={songPrefs.handleToggleSimplify} active={prefs.simplify}>
            Easy
          </IconButton>
          <IconButton label="Notation" onClick={device.handleToggleNotation}>
            {device.notation === 'italian' ? 'Do' : 'C'}
          </IconButton>
          <IconButton label="Sections" onClick={sections.handleToggleEditing} active={sections.editing}>
            <ListTree className="size-5" />
          </IconButton>
        </ButtonGroup>
        <ButtonGroup>
          <IconButton label="Edit" href={`/songs/${song.id}/edit`}>
            <Pencil className="size-5" />
          </IconButton>
          <ReloadButton />
        </ButtonGroup>
      </header>

      {/* The sheet and its source link share one column, centred on wide screens. */}
      <div className="flex flex-col gap-4 md:mx-auto md:w-fit md:max-w-full">
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: tapping the sheet hides the bar on touch screens; every control stays reachable by keyboard */}
        <main onClick={stage.handleSheetTap}>
          <SheetView
            blocks={sheet.blocks}
            fontClass={device.fontClass}
            onChordTap={quickEdit.handleChordTap}
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
          <a href={song.sourceUrl} target="_blank" rel="noreferrer" className="self-start text-xs text-stone-400 underline">
            Source
          </a>
        )}
      </div>

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
          backHref="/"
          visible={stage.controlsVisible}
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

      <ChordQuickEdit edit={quickEdit} />
    </div>
  );
}
