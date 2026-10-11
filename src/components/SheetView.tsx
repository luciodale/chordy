import clsx from 'clsx';
import { useFitChords } from '@/hooks/useFitChords';
import { Move, X } from 'lucide-react';
import type { Placing } from '@/hooks/useSectionEditor';
import type { SheetBlock } from '@/lib/chords/blocks';
import type { ChordView, DisplayLine, Piece } from '@/lib/chords/render';

type ChordTap = (chord: ChordView) => void;

// Present while the viewer is in Sections mode.
export type SectionEditing = {
  placing: Placing;
  onPickLabel: (block: SheetBlock) => void;
  onRemoveLabel: (block: SheetBlock) => void;
  onPlace: (before: number) => void;
};

type SheetViewProps = {
  blocks: SheetBlock[];
  fontClass: string;
  onChordTap?: ChordTap;
  sections?: SectionEditing;
};

const NBSP = ' ';

type ChordChipProps = { chord: ChordView; muted?: boolean; onChordTap?: ChordTap };

function ChordChip({ chord, muted, onChordTap }: ChordChipProps) {
  // Not a chord (a repeat mark like "x4", "N.C."): plain annotation, no chip.
  if (!chord.chord) {
    return <span className="whitespace-nowrap font-sans text-sm italic text-stone-500">{chord.label}</span>;
  }
  return (
    <button
      type="button"
      className={clsx(
        // Negative margin cancels the padding so the chip never shifts layout.
        '-mx-0.5 whitespace-nowrap rounded px-0.5 text-left font-bold',
        muted
          ? 'bg-stone-100 text-stone-500 dark:bg-stone-800/60 dark:text-stone-400'
          : 'bg-stone-200 text-stone-950 dark:bg-stone-700 dark:text-white',
      )}
      onClick={(event) => {
        event.stopPropagation();
        onChordTap?.(chord);
      }}
    >
      {chord.label}
    </button>
  );
}

type PieceViewProps = {
  piece: Piece;
  showChordRow: boolean;
  onChordTap?: ChordTap;
};

function PieceView({ piece, showChordRow, onChordTap }: PieceViewProps) {
  const chord = piece.chord;
  return (
    <span className="inline-flex flex-col">
      {showChordRow &&
        chord && (
          // A floating chord sits in a zero width box and overhangs the text,
          // so the lyric keeps its natural spacing.
          <span
            data-float={piece.reserve ? undefined : ''}
            className={clsx('flex', piece.reserve ? 'pr-2' : 'w-0 data-fit:w-auto data-fit:pr-2')}
          >
            <ChordChip chord={chord} onChordTap={onChordTap} />
          </span>
        )}
      <span className="whitespace-pre">{piece.text || NBSP}</span>
    </span>
  );
}

type LineViewProps = { line: DisplayLine; onChordTap?: ChordTap };

function LineView({ line, onChordTap }: LineViewProps) {
  if (line.kind !== 'lyrics') return null;

  // Instrumental: chords only, dimmed and evenly spaced so they read as
  // "play this" rather than as part of the sung line.
  if (!line.hasLyrics) {
    const chords = line.words.flat().flatMap((piece) => (piece.chord ? [piece.chord] : []));
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-0.5">
        {chords.map((chord, index) => (
          <ChordChip key={`${index}-${chord.label}`} chord={chord} muted onChordTap={onChordTap} />
        ))}
      </div>
    );
  }

  return (
    // Rows align at the bottom: only chorded pieces grow a chord row, so a
    // wrapped row without chords takes no extra height.
    <div className="flex flex-wrap items-end">
      {line.words.map((word, wordIndex) => (
        // A word wider than the whole row may still wrap between its chord pieces.
        <span key={wordIndex} className="inline-flex max-w-full flex-wrap items-end">
          {word.map((piece, pieceIndex) => (
            <PieceView key={pieceIndex} piece={piece} showChordRow={line.hasChords} onChordTap={onChordTap} />
          ))}
        </span>
      ))}
    </div>
  );
}

const LABEL_TEXT = 'font-sans text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400';

type BlockLabelProps = { block: SheetBlock; sections?: SectionEditing };

function BlockLabel({ block, sections }: BlockLabelProps) {
  if (!block.label) return null;
  if (!sections || block.labelSource === null) return <p className={LABEL_TEXT}>{block.label}</p>;

  const picked = sections.placing?.from === block.labelSource;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          sections.onPickLabel(block);
        }}
        className={clsx(
          'flex items-center gap-1.5 rounded-md border px-2 py-1',
          LABEL_TEXT,
          picked ? 'border-amber-500 bg-amber-500 text-stone-950 dark:text-stone-950' : 'border-dashed border-stone-400',
        )}
      >
        <Move className="size-3.5" />
        {block.label}
      </button>
      <button
        type="button"
        aria-label={`Remove ${block.label}`}
        onClick={(event) => {
          event.stopPropagation();
          sections.onRemoveLabel(block);
        }}
        className="rounded-md p-1 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

type DropTargetProps = { before: number; sections: SectionEditing };

function DropTarget({ before, sections }: DropTargetProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        sections.onPlace(before);
      }}
      className="rounded-md border border-dashed border-amber-500 py-0.5 font-sans text-xs font-semibold text-amber-700 dark:text-amber-400"
    >
      here
    </button>
  );
}

export function SheetView({ blocks, fontClass, onChordTap, sections }: SheetViewProps) {
  const ref = useFitChords(blocks, fontClass);
  const placing = sections?.placing ? sections : null;
  return (
    <div ref={ref} className={clsx('flex flex-col gap-6 font-sheet leading-snug', fontClass)}>
      {blocks.map((block, blockIndex) => (
        <section key={blockIndex} className="flex flex-col gap-2">
          <BlockLabel block={block} sections={sections} />
          {block.lines.map((line, lineIndex) => {
            // The tail of a sung line shares its source line; one target is enough.
            const previous = block.lines[lineIndex - 1];
            const showTarget = placing && line.kind === 'lyrics' && previous?.source !== line.source;
            return (
              <div key={lineIndex} className="flex flex-col gap-1">
                {showTarget && <DropTarget before={line.source} sections={placing} />}
                <LineView line={line} onChordTap={onChordTap} />
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
