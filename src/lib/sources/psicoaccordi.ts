import { isChordLine, textToChordPro } from '@/lib/chords/importText';
import { decodeEntities, htmlToText } from '@/lib/html';
import { fetchJson, type RemoteSong, type SourceAdapter } from './types';

const BLOG = 'https://psicoaccordi.blogspot.com';

type BloggerEntry = {
  id: { $t: string };
  title: { $t: string };
  link: { rel: string; href: string }[];
  content?: { $t: string };
};

type BloggerFeed = { feed: { entry?: BloggerEntry[] } };

function postId(entry: BloggerEntry): string {
  return /post-(\d+)$/.exec(entry.id.$t)?.[1] ?? '';
}

// Titles read "Cristina D'Avena - Lady Oscar (2° Serie)".
function toRemoteSong(entry: BloggerEntry): RemoteSong {
  const full = decodeEntities(entry.title.$t).trim();
  const split = full.indexOf(' - ');
  return {
    source: 'psicoaccordi',
    sourceId: postId(entry),
    title: split === -1 ? full : full.slice(split + 3).trim(),
    artist: split === -1 ? '' : full.slice(0, split).trim(),
    url: entry.link.find((link) => link.rel === 'alternate')?.href ?? BLOG,
    detail: null,
  };
}

// Posts put a blank line after every line and two or more between
// paragraphs, and open with a promo line. Keep only the song.
export function cleanPost(html: string): string {
  const lines = htmlToText(html).split('\n');
  const first = lines.findIndex((line) => isChordLine(line));
  const song = first === -1 ? lines : lines.slice(first);

  const out: string[] = [];
  let blanks = 0;
  for (const line of song) {
    if (line.trim() === '') {
      blanks += 1;
      continue;
    }
    if (blanks >= 2 && out.length > 0) out.push('');
    blanks = 0;
    out.push(line);
  }
  return out.join('\n');
}

export const psicoaccordi: SourceAdapter = {
  id: 'psicoaccordi',
  name: 'psicoaccordi (cartoni)',
  isValidId: (sourceId) => /^\d+$/.test(sourceId),

  async search(query) {
    const data = await fetchJson<BloggerFeed>(
      `${BLOG}/feeds/posts/default?alt=json&max-results=20&q=${encodeURIComponent(query)}`,
    );
    return (data.feed.entry ?? [])
      .filter((entry) => postId(entry) !== '' && !/archivio/i.test(entry.title.$t))
      .map(toRemoteSong);
  },

  async fetchSheet(sourceId) {
    const data = await fetchJson<{ entry: BloggerEntry }>(
      `${BLOG}/feeds/posts/default/${encodeURIComponent(sourceId)}?alt=json`,
    );
    const text = cleanPost(data.entry.content?.$t ?? '');
    if (!text.trim()) throw new Error('No chord sheet found in this post');
    return {
      ...toRemoteSong(data.entry),
      body: textToChordPro(text, { proportional: true }),
      songKey: null,
    };
  },
};
