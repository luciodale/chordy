import { formatChord, parseChord } from '@/lib/chords/chord';
import { textToChordPro } from '@/lib/chords/importText';
import { decodeEntities } from '@/lib/html';
import { fetchText, type RemoteSong, type SourceAdapter } from './types';

const SITE = 'https://www.ultimate-guitar.com';
const TABS = 'https://tabs.ultimate-guitar.com/tab';
const MAX_RESULTS = 10;

type UgResult = {
  id?: number;
  type?: string;
  song_name?: string;
  artist_name?: string;
  rating?: number;
  votes?: number;
  tab_url?: string;
};

type UgTab = { song_name: string; artist_name: string; tonality_name?: string };

type UgStore = {
  store: {
    page: {
      data: {
        results?: UgResult[];
        tab?: UgTab;
        tab_view?: { wiki_tab?: { content?: string } };
      };
    };
  };
};

// Pages embed their data as HTML escaped JSON in a .js-store element.
function readStore(html: string): UgStore['store']['page']['data'] {
  const raw = /class="js-store"\s+data-content="([^"]*)"/.exec(html)?.[1];
  if (!raw) throw new Error('Ultimate Guitar page format changed');
  const store: UgStore = JSON.parse(decodeEntities(raw));
  return store.store.page.data;
}

// "oasis/wonderwall-chords-39144" from the full tab URL.
function tabPath(url: string): string | null {
  return /\/tab\/([a-z0-9-]+\/[a-z0-9-]+-\d+)$/i.exec(url)?.[1] ?? null;
}

function formatVotes(votes: number): string {
  return votes >= 1000 ? `${(votes / 1000).toFixed(1)}k` : String(votes);
}

// Many uploads exist per song; keep the most voted chords version of each.
function bestPerSong(results: UgResult[]): RemoteSong[] {
  const best = new Map<string, UgResult>();
  for (const result of results) {
    if (result.type !== 'Chords' || !result.tab_url || !tabPath(result.tab_url)) continue;
    const key = `${result.artist_name ?? ''}|${result.song_name ?? ''}`.toLowerCase();
    const current = best.get(key);
    if (!current || (result.votes ?? 0) > (current.votes ?? 0)) best.set(key, result);
  }
  return [...best.values()].slice(0, MAX_RESULTS).map((result) => ({
    source: 'ultimateguitar',
    sourceId: tabPath(result.tab_url ?? '') ?? '',
    title: result.song_name ?? '',
    artist: result.artist_name ?? '',
    url: result.tab_url ?? SITE,
    detail: result.rating ? `★ ${result.rating.toFixed(1)} · ${formatVotes(result.votes ?? 0)}` : null,
  }));
}

// Guitar only material a pianist does not need: chord fingering tables
// ("Em7  022033", "Em7  0-2-2-0-3-3") and tablature staves ("e|---0---").
const FINGERING = /^\s*\S+\s+[x\d]{1,2}(?:[-\s.]?[x\d]{1,2}){5}\s*$/i;
const TAB_STAFF = /^\s*[eBGDAE]\|.*$/;

export function cleanContent(content: string): string {
  return content
    .replace(/\[\/?(tab|ch)\]/g, '')
    .split(/\r?\n/)
    .filter((line) => !FINGERING.test(line) && !TAB_STAFF.test(line))
    .join('\n');
}

export const ultimateguitar: SourceAdapter = {
  id: 'ultimateguitar',
  name: 'Ultimate Guitar',
  isValidId: (sourceId) => tabPath(`/tab/${sourceId}`) === sourceId,

  async search(query) {
    const html = await fetchText(`${SITE}/search.php?search_type=title&value=${encodeURIComponent(query)}`);
    return bestPerSong(readStore(html).results ?? []);
  },

  async fetchSheet(sourceId) {
    const url = `${TABS}/${sourceId}`;
    const data = readStore(await fetchText(url));
    const content = data.tab_view?.wiki_tab?.content;
    if (!data.tab || !content) throw new Error('No chord sheet found on this page');
    const key = data.tab.tonality_name ? parseChord(data.tab.tonality_name) : null;
    return {
      source: 'ultimateguitar',
      sourceId,
      title: data.tab.song_name,
      artist: data.tab.artist_name,
      url,
      detail: null,
      body: textToChordPro(cleanContent(content)),
      songKey: key ? formatChord(key, 'english') : null,
    };
  },
};
