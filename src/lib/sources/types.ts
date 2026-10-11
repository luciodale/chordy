import type { SongSource } from '@/db/schema';

export type RemoteSourceId = Exclude<SongSource, 'manual'>;

export type RemoteSong = {
  source: RemoteSourceId;
  sourceId: string;
  title: string;
  artist: string;
  url: string;
  // Extra context for picking between results, e.g. a rating.
  detail: string | null;
};

export type RemoteSheet = RemoteSong & { body: string; songKey: string | null };

export type SourceAdapter = {
  id: RemoteSourceId;
  name: string;
  isValidId: (sourceId: string) => boolean;
  search: (query: string) => Promise<RemoteSong[]>;
  fetchSheet: (sourceId: string) => Promise<RemoteSheet>;
};

export const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
};

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: BROWSER_HEADERS });
  if (!response.ok) throw new Error(`${new URL(url).hostname} responded ${response.status}`);
  return response.text();
}

export async function fetchJson<T>(url: string): Promise<T> {
  return JSON.parse(await fetchText(url)) as T;
}
