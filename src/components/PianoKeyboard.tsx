import clsx from 'clsx';

type PianoKeyboardProps = { keys: number[]; octaves: number };

const WHITE_PITCHES = [0, 2, 4, 5, 7, 9, 11];
// Black key pitch -> index of the white key on its left.
const BLACK_KEYS: [number, number][] = [
  [1, 0],
  [3, 1],
  [6, 3],
  [8, 4],
  [10, 5],
];
const WHITE_WIDTH = 10;
const WHITE_HEIGHT = 44;
const BLACK_WIDTH = 6;
const BLACK_HEIGHT = 28;

export function PianoKeyboard({ keys, octaves }: PianoKeyboardProps) {
  const pressed = new Set(keys);
  const whites = Array.from({ length: octaves * 7 }, (_, index) => ({
    index,
    pitch: Math.floor(index / 7) * 12 + (WHITE_PITCHES[index % 7] ?? 0),
  }));
  const blacks = Array.from({ length: octaves }, (_, octave) =>
    BLACK_KEYS.map(([pitch, left]) => ({ x: (octave * 7 + left + 1) * WHITE_WIDTH - BLACK_WIDTH / 2, pitch: octave * 12 + pitch })),
  ).flat();

  return (
    <svg
      viewBox={`0 0 ${octaves * 7 * WHITE_WIDTH} ${WHITE_HEIGHT}`}
      className="w-full max-w-md"
      role="img"
      aria-label="Chord on a piano keyboard"
    >
      {whites.map(({ index, pitch }) => (
        <rect
          key={`w${index}`}
          x={index * WHITE_WIDTH}
          y={0}
          width={WHITE_WIDTH}
          height={WHITE_HEIGHT}
          rx={1}
          className={clsx('stroke-stone-400', pressed.has(pitch) ? 'fill-amber-400' : 'fill-white')}
          strokeWidth={0.5}
        />
      ))}
      {blacks.map(({ x, pitch }) => (
        <rect
          key={`b${pitch}`}
          x={x}
          y={0}
          width={BLACK_WIDTH}
          height={BLACK_HEIGHT}
          rx={1}
          className={pressed.has(pitch) ? 'fill-amber-500' : 'fill-stone-900'}
        />
      ))}
    </svg>
  );
}
