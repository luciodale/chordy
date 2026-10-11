import { describe, expect, it } from 'vitest';
import { formatChord, parseChord, simplifyChord, transposeChord } from './chord';
import { parseChordPro } from './chordpro';
import { textToChordPro } from './importText';
import { prefersFlats } from './key';
import { cleanPost } from '../sources/psicoaccordi';
import { cleanContent } from '../sources/ultimateguitar';
import { borrowChords, fillRepeatedSections } from './repeat';
import { insertLabel, moveLine, removeLine } from './sections';
import { groupBlocks } from './blocks';
import { chordIntervals, chordVoicing } from './piano';
import { renderSheet } from './render';

function chord(token: string) {
  const parsed = parseChord(token);
  if (!parsed) throw new Error(`not a chord: ${token}`);
  return parsed;
}

describe('parseChord', () => {
  it.each([
    ['Am7', { root: 'A', suffix: 'm7', bass: null }],
    ['LAm', { root: 'A', suffix: 'm', bass: null }],
    ['La-', { root: 'A', suffix: 'm', bass: null }],
    ['SOL4', { root: 'G', suffix: '4', bass: null }],
    ['FAm/LAb', { root: 'F', suffix: 'm', bass: 'Ab' }],
    ['Sib', { root: 'Bb', suffix: '', bass: null }],
    ['Do7', { root: 'C', suffix: '7', bass: null }],
    ['C6/9', { root: 'C', suffix: '6/9', bass: null }],
    ['F#m7b5', { root: 'F#', suffix: 'm7b5', bass: null }],
    ['DO#/RE#m', { root: 'C#', suffix: '', bass: 'D#' }],
  ])('%s', (token, expected) => {
    expect(parseChord(token)).toEqual(expected);
  });

  it.each(['E', 'A'])('accepts single letter %s', (token) => {
    expect(parseChord(token)).not.toBeNull();
  });

  it.each(['la', 'mi', 'Hello', 'Era', 'Sole', 'Mia', 'Dove', 'Ama'])('rejects word %s', (token) => {
    expect(parseChord(token)).toBeNull();
  });
});

describe('transpose and simplify', () => {
  it('transposes with the requested spelling', () => {
    expect(formatChord(transposeChord(chord('C/E'), 3, true), 'english')).toBe('Eb/G');
    expect(formatChord(transposeChord(chord('Am7'), 1, false), 'english')).toBe('A#m7');
  });

  it('keeps the original spelling at zero', () => {
    expect(formatChord(transposeChord(chord('Gb'), 0, false), 'english')).toBe('Gb');
  });

  it('simplifies to triads and keeps the bass', () => {
    expect(formatChord(simplifyChord(chord('Am7add9')), 'english')).toBe('Am');
    expect(formatChord(simplifyChord(chord('Cmaj7/E')), 'english')).toBe('C/E');
    expect(formatChord(simplifyChord(chord('Bm7b5')), 'english')).toBe('Bdim');
  });

  it('formats in Italian notation', () => {
    expect(formatChord(chord('Bbm7/F'), 'italian')).toBe('Sibm7/Fa');
  });

  it('picks flats for flat keys, minor via relative major', () => {
    expect(prefersFlats(chord('C'), 5)).toBe(true);
    expect(prefersFlats(chord('C'), 2)).toBe(false);
    expect(prefersFlats(chord('Am'), 5)).toBe(true);
    expect(prefersFlats(chord('Am'), 7)).toBe(false);
  });
});

describe('textToChordPro', () => {
  it('merges chords over lyrics in Italian notation', () => {
    const text = ['Intro:', 'DO/MI    LAm', '', 'DO          SOL', 'Una canzone di prova qui', 'E poi il resto'].join('\n');
    expect(textToChordPro(text)).toBe(
      ['{c: Intro}', '[C/E] [Am]', '', '[C]Una canzone [G]di prova qui', 'E poi il resto'].join('\n'),
    );
  });

  it('keeps a lyric line that starts with E', () => {
    const text = ['    LAm', 'E vado avanti'].join('\n');
    expect(textToChordPro(text)).toBe('E va[Am]do avanti');
  });

  it('pads chords past the end of the lyric', () => {
    expect(textToChordPro(['C        G', 'ciao'].join('\n'))).toBe('[C]ciao     [G]');
  });

  it('reads labels with chords on the same line', () => {
    expect(textToChordPro('Intro: LAm FA DO SOL')).toBe('{c: Intro}\n[Am] [F] [C] [G]');
  });

  it('converts chords inside existing ChordPro', () => {
    expect(textToChordPro('{title: Prova}\n[LAm]ciao [SOL]mondo')).toBe(
      '{title: Prova}\n[Am]ciao [G]mondo',
    );
  });
});

describe('parse and render', () => {
  const sheet = parseChordPro('{key: C}\n{soc}\n[C]Pri[G]ma riga\n{eoc}\n\n[Am] [F]');
  const options = { transpose: 2, simplify: false, notation: 'english', preferFlats: false } as const;

  it('reads meta and chorus', () => {
    expect(sheet.meta.key).toBe('C');
    expect(sheet.lines[0]).toMatchObject({ kind: 'lyrics', inChorus: true, hasChords: true });
  });

  it('groups pieces into words so chords wrap with their syllable', () => {
    const line = renderSheet(sheet, options)[0];
    if (line?.kind !== 'lyrics') throw new Error('expected lyrics');
    expect(line.words.map((word) => word.map((piece) => [piece.chord?.label ?? null, piece.text]))).toEqual([
      [
        ['D', 'Pri'],
        ['A', 'ma '],
      ],
      [[null, 'riga']],
    ]);
  });
});

describe('chordVoicing', () => {
  it('stacks a slash chord with the bass first', () => {
    expect(chordVoicing(chord('C/E')).keys).toEqual([4, 12, 16, 19]);
  });

  it('reads Italian sus4 shorthand', () => {
    expect(chordVoicing(chord('SOL4')).keys).toEqual([7, 12, 14]);
  });

  it('voices a seventh chord', () => {
    expect(chordVoicing(chord('Am7')).keys).toEqual([9, 12, 16, 19]);
  });
});

describe('chordIntervals', () => {
  it.each([
    ['', [0, 4, 7]],
    ['m7', [0, 3, 7, 10]],
    ['maj7', [0, 4, 7, 11]],
    ['7', [0, 4, 7, 10]],
    ['m7b5', [0, 3, 6, 10]],
    ['sus4', [0, 5, 7]],
    ['7sus4', [0, 5, 7, 10]],
    ['4', [0, 5, 7]],
    ['add9', [0, 4, 7, 14]],
    ['9', [0, 4, 7, 10, 14]],
    ['7#9', [0, 4, 7, 10, 15]],
    ['6', [0, 4, 7, 9]],
    ['dim7', [0, 3, 6, 9]],
    ['aug', [0, 4, 8]],
    ['m', [0, 3, 7]],
  ])('%s', (suffix, expected) => {
    expect(chordIntervals(suffix)).toEqual(expected);
  });
});

describe('lyric spacing', () => {
  const options = { transpose: 0, simplify: false, notation: 'english', preferFlats: false } as const;

  function pieces(source: string) {
    const line = renderSheet(parseChordPro(source), options)[0];
    if (line?.kind !== 'lyrics') throw new Error('expected lyrics');
    return line.words.flat().map((piece) => [piece.chord?.label ?? null, piece.text, piece.reserve]);
  }

  it('drops the indent under a leading chord and collapses inner padding', () => {
    expect(pieces('[C]  walking   down [G]here')).toEqual([
      ['C', 'walking ', false],
      [null, 'down ', false],
      ['G', 'here', false],
    ]);
  });

  it('keeps a chord before the first word attached to it', () => {
    expect(pieces('  [Am]  [F]river')).toEqual([
      ['Am', '', true],
      ['F', 'river', false],
    ]);
  });

  it('reserves width only when the next chord is too close', () => {
    expect(pieces('[Fmaj7]to[G]day and [C]then')).toEqual([
      ['Fmaj7', 'to', true],
      ['G', 'day ', false],
      [null, 'and ', false],
      ['C', 'then', false],
    ]);
  });

  it('leaves instrumental lines untouched', () => {
    expect(pieces('[C] [G]')).toEqual([
      ['C', ' ', true],
      ['G', '', false],
    ]);
  });
});

describe('instrumental tail', () => {
  const options = { transpose: 0, simplify: false, notation: 'english', preferFlats: false } as const;

  it('moves chords after the last sung syllable to their own line', () => {
    const lines = renderSheet(parseChordPro('[C]sing a [G]line    [Am]      [F]'), options);
    expect(lines).toHaveLength(2);
    const [sung, tail] = lines;
    if (sung?.kind !== 'lyrics' || tail?.kind !== 'lyrics') throw new Error('expected lyrics');
    expect(sung.words.flat().map((piece) => piece.chord?.label ?? null)).toEqual(['C', null, 'G']);
    expect(tail.hasLyrics).toBe(false);
    expect(tail.words.flat().map((piece) => piece.chord?.label)).toEqual(['Am', 'F']);
  });

  it('reserves width when a wide chord sits over narrow text', () => {
    const line = renderSheet(parseChordPro('[C#m7/G#]il [F]resto'), options)[0];
    if (line?.kind !== 'lyrics') throw new Error('expected lyrics');
    expect(line.words.flat()[0]?.reserve).toBe(true);
  });
});

describe('groupBlocks', () => {
  const options = { transpose: 0, simplify: false, notation: 'english', preferFlats: false } as const;

  function blocks(source: string) {
    return groupBlocks(renderSheet(parseChordPro(source), options)).map((block) => ({
      label: block.label,
      labelSource: block.labelSource,
      lines: block.lines.length,
    }));
  }

  it('splits at blank lines and labels', () => {
    expect(blocks('{c: Intro}\n[C] [G]\n\n[C]first verse line\n[G]second verse line')).toEqual([
      { label: 'Intro', labelSource: 0, lines: 1 },
      { label: null, labelSource: null, lines: 2 },
    ]);
  });

  it('labels a {soc} section as a fixed chorus', () => {
    expect(blocks('{soc}\n[F]oh oh the refrain here\n{eoc}')[0]).toEqual({ label: 'Chorus', labelSource: null, lines: 1 });
  });

  it('never infers labels from repeated lyrics', () => {
    const chorus = '[F]we sing it all [G]again\n[C]and again tonight';
    const result = blocks(`[C]a verse that is one\n\n${chorus}\n\n[C]a verse that is two\n\n${chorus}`);
    expect(result.every((block) => block.label === null)).toBe(true);
  });
});

describe('section label edits', () => {
  const body = '[C]line one\n[F]line two\n\n[G]line three';

  it('inserts a label before a line', () => {
    expect(insertLabel(body, 'Chorus', 1)).toBe('[C]line one\n{c: Chorus}\n[F]line two\n\n[G]line three');
  });

  it('moves a label down and up', () => {
    const labelled = insertLabel(body, 'Verse', 0);
    expect(moveLine(labelled, 0, 4)).toBe('[C]line one\n[F]line two\n\n{c: Verse}\n[G]line three');
    const moved = moveLine(labelled, 0, 4);
    expect(moveLine(moved, 3, 0)).toBe(labelled);
  });

  it('ignores moves onto itself', () => {
    expect(moveLine(body, 1, 2)).toBe(body);
  });

  it('removes a label', () => {
    expect(removeLine(insertLabel(body, 'Verse', 0), 0)).toBe(body);
  });
});

describe('import shorthand and proportional sheets', () => {
  it('expands a bare number after a chord', () => {
    expect(textToChordPro('Sol        4      Sol')).toBe('[G] [G4] [G]');
  });

  it('keeps a standalone number line as lyrics', () => {
    expect(textToChordPro('4 strade')).toBe('4 strade');
  });

  it('maps chord columns by visual width for proportional sheets', () => {
    // In a proportional font a run of spaces is far narrower than letters, so
    // a chord typed after 12 spaces lands earlier in the lyric than column 12.
    const chordLine = '            Re';
    const lyric = 'mmmmmmmmmmmm';
    expect(textToChordPro(`${chordLine}\n${lyric}`)).toBe('mmmmmmmmmmmm[D]');
    expect(textToChordPro(`${chordLine}\n${lyric}`, { proportional: true })).toBe('mmmm[D]mmmmmmmm');
  });
});

describe('source cleanup', () => {
  it('psicoaccordi: drops the promo line and blog line spacing', () => {
    const html = 'Promo text with a <a href="#">link</a>!<br /><br />Sol &nbsp; &nbsp; Re<br /><br />prima riga<br /><br /><br />Do<br /><br />seconda parte';
    expect(cleanPost(html)).toBe('Sol     Re\nprima riga\n\nDo\nseconda parte');
  });

  it('ultimate guitar: strips tags, fingering tables and tab staves', () => {
    const content = 'Em7    022033\nG/F#    2-x-0-0-3-3\ne|---0---|\n[Verse]\n[tab][ch]Em7[/ch]   [ch]G[/ch]\nsome words here[/tab]';
    expect(cleanContent(content)).toBe('[Verse]\nEm7   G\nsome words here');
  });
});

describe('chord line extras', () => {
  it('reads Italian 7+ as major seventh, English 7+ as augmented', () => {
    expect(parseChord('Si7+')).toEqual({ root: 'B', suffix: 'maj7', bass: null });
    expect(parseChord('C7+')).toEqual({ root: 'C', suffix: '7+', bass: null });
  });

  it('accepts bracketed chord groups and notes on a chord line', () => {
    const text = ['Si7+  Sol#7   [Re  Sol] (Chiude)', 'una riga di prova qui sotto'].join('\n');
    expect(textToChordPro(text)).toBe('[Bmaj7]una ri[G#7]ga di pro[D]va q[G]ui so[(Chiude)]tto');
  });

  it('stays a plain sheet when a single bracketed chord appears', () => {
    const text = ['Do      Sol', 'prima riga', '[Fa]'].join('\n');
    expect(textToChordPro(text)).toBe('[C]prima ri[G]ga\n[F]');
  });
});

describe('bracketed notes on chord lines', () => {
  it('keeps the chord of a numbered ending and turns the rest into notes', () => {
    const text = ['C      Dm7   [1: F]', 'some words for a test'].join('\n');
    expect(textToChordPro(text)).toBe('[C]some wo[Dm7]rds fo[(1:)]r a t[F]est');
  });

  it('reads a note without chords', () => {
    const text = ['C     G     [2: to bridge]', 'another line to test here'].join('\n');
    expect(textToChordPro(text)).toBe('[C]anothe[G]r line[(2:_to_bridge)] to test here');
  });
});

describe('fillRepeatedSections', () => {
  const options = { transpose: 0, simplify: false, notation: 'english', preferFlats: false } as const;
  const body = [
    '{c: Verse 1}',
    '[C]walking in the [G]morning light',
    '[Am]talking to the [F]river',
    '',
    '{c: Verse 2}',
    'running past the evening hill',
    'singing to the water',
    '',
    '{c: Bridge}',
    'nothing borrowed here',
  ].join('\n');

  function blocks() {
    return groupBlocks(renderSheet(fillRepeatedSections(parseChordPro(body)), options));
  }

  it('borrows chords from the earlier section with the same name', () => {
    const verse2 = blocks()[1];
    expect(verse2?.label).toBe('Verse 2');
    expect(verse2?.note).toBe('chords from Verse 1');
    const first = verse2?.lines[0];
    if (first?.kind !== 'lyrics') throw new Error('expected lyrics');
    expect(first.words.flat().filter((piece) => piece.chord).map((piece) => [piece.chord?.label, piece.text])).toEqual([
      ['C', 'running '],
      ['G', 'evening '],
    ]);
  });

  it('leaves sections without a matching earlier section alone', () => {
    const bridge = blocks()[2];
    expect(bridge?.note).toBeNull();
    const line = bridge?.lines[0];
    expect(line?.kind === 'lyrics' && line.hasChords).toBe(false);
  });

  it('never touches a section that has its own chords', () => {
    const verse1 = blocks()[0];
    expect(verse1?.note).toBeNull();
  });
});

describe('ultimate guitar credits', () => {
  it('drops lines before the first section or chord line', () => {
    expect(cleanContent('Tabbed by someone\nthanks to a friend\n\n[Intro]\nC  G')).toBe('[Intro]\nC  G');
  });
});

describe('borrowChords', () => {
  it('copies chords but not notes', () => {
    const template = parseChordPro('[C]one two [(1:)]three [G]four').lines[0];
    const target = parseChordPro('five six seven eight').lines[0];
    if (template?.kind !== 'lyrics' || target?.kind !== 'lyrics') throw new Error('expected lyrics');
    expect(borrowChords(template.segments, target.segments).map((segment) => segment.chord)).toEqual(['C', 'G']);
  });
});
