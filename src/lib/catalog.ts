import type { SongSummary } from './songs';
import type { RemoteSong } from './sources/types';

export type SearchResult = RemoteSong & {
  // Set when the song is already in the library.
  songId: number | null;
};

export type SourceResults = {
  source: string;
  name: string;
  results: SearchResult[];
  error: string | null;
};

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function filterSongs(songs: SongSummary[], query: string): SongSummary[] {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  if (terms.length === 0) return songs;
  return songs.filter((song) => {
    const haystack = normalizeSearch(`${song.title} ${song.artist}`);
    return terms.every((term) => haystack.includes(term));
  });
}
