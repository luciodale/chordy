import { formatChord, isChord, parseChord } from './chord';

// Tokens that may sit on a chord line without being chords: bar lines,
// repeat marks, "N.C.", and short notes in parentheses such as "(Chiude)".
const FILLER = /^(\|+|-+|\/+|%|:|\.+|x\d+|\d+x|\(x?\d+x?\)|N\.?C\.?|\([^()\s]{1,24}\))$/i;

const LABEL_WORDS =
  /^(intro|strofa|rit\.?|ritornello|pre[- ]?rit\.?|pre[- ]?ritornello|ponte|bridge|special|finale|outro|coda|solo|interludio|chorus|pre[- ]?chorus|verse|strumentale|instrumental)\b/i;

function stripParens(token: string): string {
  return token.replace(/^\(+/, '').replace(/\)+$/, '');
}

// A bare number after a chord is shorthand for that root with the number,
// e.g. "Sol ... 4" means Sol4 at that spot.
const SHORTHAND = /^\d{1,2}$/;

function chordTokens(text: string): string[] | null {
  const tokens = text.trim().split(/\s+/);
  let chords = 0;
  for (const token of tokens) {
    if (isChord(stripParens(token))) chords += 1;
    else if (!(FILLER.test(token) || (chords > 0 && SHORTHAND.test(token)))) return null;
  }
  return chords > 0 ? tokens : null;
}

export function isChordLine(line: string): boolean {
  return line.trim() !== '' && chordTokens(line) !== null;
}

// Chord lines may carry bracketed groups: plain chord groups "[Re Sol Sim]",
// or notes such as "[1: F]" (first ending, play F) and "[2: to bridge]".
// Chord groups lose their brackets; notes become one "(…)" token; a note
// ending in chords keeps them as chords. Every column stays where it was.
function unbracketGroups(line: string): string {
  return line.replace(/\[([^\]]*)\]/g, (whole, inner: string) => {
    const tokens = inner.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return whole;
    if (tokens.every((token) => isChord(token))) return ` ${inner} `;

    let split = tokens.length;
    while (split > 0 && isChord(tokens[split - 1] ?? '')) split -= 1;
    const note = tokens.slice(0, split).join('_');
    const chords = tokens.slice(split).join(' ');
    const replaced = chords ? `(${note}) ${chords}` : `(${note})`;
    return replaced.padEnd(whole.length, ' ');
  });
}

function asChordLine(line: string): string | null {
  if (isChordLine(line)) return line;
  const unbracketed = unbracketGroups(line);
  return unbracketed !== line && isChordLine(unbracketed) ? unbracketed : null;
}

function toEnglish(token: string): string {
  const bare = stripParens(token);
  const chord = parseChord(bare);
  return chord ? formatChord(chord, 'english') : token;
}

function bracketed(token: string): string {
  return `[${toEnglish(token)}]`;
}

type PlacedChord = { column: number; token: string };

// Reads the chord tokens of a chord line with their columns, expanding the
// "root then bare number" shorthand into a full chord name.
function placeChords(chordLine: string): PlacedChord[] {
  let lastRoot: string | null = null;
  return [...chordLine.matchAll(/\S+/g)].map((match) => {
    const token = match[0];
    const chord = parseChord(stripParens(token));
    if (chord) lastRoot = chord.root;
    const expanded = !chord && lastRoot && SHORTHAND.test(token) ? `${lastRoot}${token}` : token;
    return { column: match.index, token: expanded };
  });
}

// Approximate advance widths, in em, of a proportional sans font, for sheets
// that were lined up by eye in such a font rather than in monospace.
const NARROW = new Set("iljtfrI.,'\u2019:;!|()");
const WIDE = new Set('mwMW');

function estimateWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    if (char === ' ') width += 0.28;
    else if (NARROW.has(char)) width += 0.3;
    else if (WIDE.has(char)) width += 0.85;
    else if (/[A-Z#]/.test(char)) width += 0.68;
    else if (/\d/.test(char)) width += 0.56;
    else width += 0.53;
  }
  return width;
}

// Maps a chord line column to the lyric column at the same visual offset.
function proportionalColumn(chordLine: string, column: number, lyric: string): number {
  const target = estimateWidth(chordLine.slice(0, column));
  let width = 0;
  for (let index = 0; index < lyric.length; index += 1) {
    const next = width + estimateWidth(lyric[index] ?? '');
    if (next > target) return target - width < next - target ? index : index + 1;
    width = next;
  }
  return lyric.length + Math.max(0, Math.round((target - width) / 0.28));
}

type LabelMatch = { label: string; chords: string | null };

function readLabel(line: string): LabelMatch | null {
  const trimmed = line.trim();
  const bracket = /^\[([^\]]+)\]$/.exec(trimmed);
  if (bracket?.[1] && !isChord(bracket[1])) return { label: bracket[1], chords: null };

  const colon = /^([^:]{1,30}):\s*(.*)$/.exec(trimmed);
  if (colon?.[1] && !isChordLine(colon[1])) {
    const rest = colon[2] ?? '';
    if (rest === '') return { label: colon[1], chords: null };
    if (isChordLine(rest)) return { label: colon[1], chords: rest };
  }

  if (LABEL_WORDS.test(trimmed) && trimmed.length <= 30 && !/[,;]/.test(trimmed)) {
    return { label: trimmed.replace(/:$/, ''), chords: null };
  }
  return null;
}

function instrumental(line: string): string {
  return placeChords(line)
    .map((chord) => bracketed(chord.token))
    .join(' ');
}

// Places each chord of `chordLine` at its column inside `lyric`.
function mergeLine(chordLine: string, lyric: string, proportional: boolean): string {
  const placed = placeChords(chordLine).map((chord) => ({
    token: chord.token,
    column: proportional ? proportionalColumn(chordLine, chord.column, lyric) : chord.column,
  }));
  const width = Math.max(lyric.length, ...placed.map((chord) => chord.column));
  let merged = lyric.padEnd(width, ' ');
  for (const { column, token } of placed.reverse()) {
    merged = merged.slice(0, column) + bracketed(token) + merged.slice(column);
  }
  return merged.replace(/\s+$/, '');
}

function expandTabs(line: string): string {
  let out = '';
  for (const char of line) {
    out += char === '\t' ? ' '.repeat(8 - (out.length % 8)) : char;
  }
  return out;
}

const DIRECTIVE_LINE = /^\s*\{[a-z_]+(?::.*)?\}\s*$/im;
const INLINE_CHORD = /\[([^\]\s]+)\]/g;

// ChordPro never has bare chord lines; a plain sheet always does. So any
// bare chord line settles it, whatever brackets appear elsewhere.
export function looksLikeChordPro(text: string): boolean {
  if (text.split('\n').some((line) => isChordLine(line))) return false;
  if (DIRECTIVE_LINE.test(text)) return true;
  return [...text.matchAll(INLINE_CHORD)].some((match) => isChord(match[1] ?? ''));
}

export type ImportOptions = {
  // The sheet was aligned in a proportional font, so chord columns are mapped
  // by visual width instead of character count.
  proportional?: boolean;
};

// Accepts either ChordPro or a plain "chords over lyrics" sheet in English or
// Italian notation, and returns ChordPro with English chord names.
export function textToChordPro(text: string, options: ImportOptions = {}): string {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/ /g, ' ');

  if (looksLikeChordPro(normalized)) {
    return normalized.replace(INLINE_CHORD, (whole, token: string) =>
      isChord(token) ? bracketed(token) : whole,
    );
  }

  const lines = normalized.split('\n').map((line) => expandTabs(line).replace(/\s+$/, ''));
  const out: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';

    if (line.trim() === '') {
      out.push('');
      continue;
    }

    const label = readLabel(line);
    if (label) {
      out.push(`{c: ${label.label}}`);
      if (label.chords) out.push(instrumental(label.chords));
      continue;
    }

    const chordLine = asChordLine(line);
    if (chordLine) {
      const next = lines[index + 1] ?? '';
      if (next.trim() !== '' && !asChordLine(next) && !readLabel(next)) {
        out.push(mergeLine(chordLine, next, options.proportional ?? false));
        index += 1;
      } else {
        out.push(instrumental(chordLine));
      }
      continue;
    }

    out.push(line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
