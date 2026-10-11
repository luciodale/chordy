import { formatChord, parseChord } from '@/lib/chords/chord';
import { textToChordPro } from '@/lib/chords/importText';
import { decodeEntities, htmlToText } from '@/lib/html';
import { fetchJson, type RemoteSong, type SourceAdapter } from './types';

const API = 'https://www.accordiespartiti.it/wp-json/wp/v2';

type WpSearchHit = { id: number; title: string; url: string; subtype: string };

type WpTerm = { name: string; taxonomy: string };

type WpPost = {
  id: number;
  title: { rendered: string };
  link: string;
  content?: { rendered: string };
  _embedded?: { 'wp:term'?: WpTerm[][] };
};

// Categories read "Britti (Alex)"; show them as "Alex Britti".
export function artistName(category: string): string {
  const match = /^(.+?)\s*\((.+)\)$/.exec(category.trim());
  return match ? `${match[2]} ${match[1]}` : category.trim();
}

function artistFromSlug(link: string): string {
  const slug = /\/accordi\/[^/]+\/([^/]+)\//.exec(link)?.[1] ?? '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function postArtist(post: WpPost): string {
  const category = post._embedded?.['wp:term']?.flat().find((term) => term.taxonomy === 'category');
  return category ? artistName(decodeEntities(category.name)) : artistFromSlug(post.link);
}

function toRemoteSong(post: WpPost): RemoteSong {
  return {
    source: 'accordiespartiti',
    sourceId: String(post.id),
    title: decodeEntities(post.title.rendered),
    artist: postArtist(post),
    url: post.link,
    detail: null,
  };
}

export function extractSheet(html: string): { text: string; songKey: string | null } | null {
  const pre = /<pre[^>]*>([\s\S]*?)(?:<\/pre>|$)/i.exec(html);
  if (!pre?.[1]) return null;
  const keyName = /class="chiave"[^>]*name="([^"]+)"/i.exec(html)?.[1];
  const keyChord = keyName ? parseChord(keyName) : null;
  return {
    text: htmlToText(pre[1]),
    songKey: keyChord ? formatChord(keyChord, 'english') : null,
  };
}

export const accordiespartiti: SourceAdapter = {
  id: 'accordiespartiti',
  name: 'accordiespartiti.it',
  isValidId: (sourceId) => /^\d+$/.test(sourceId),

  async search(query) {
    // The search endpoint ranks far better than posts?search=, but carries no
    // artist; a second call fetches the posts with their categories.
    const hits = await fetchJson<WpSearchHit[]>(
      `${API}/search?search=${encodeURIComponent(query)}&type=post&per_page=20`,
    );
    const ids = hits.filter((hit) => hit.url.includes('/accordi/')).map((hit) => hit.id);
    if (ids.length === 0) return [];

    const posts = await fetchJson<WpPost[]>(
      `${API}/posts?include=${ids.join(',')}&per_page=${ids.length}&_fields=id,title,link,_links,_embedded&_embed=wp:term`,
    );
    const byId = new Map(posts.map((post) => [post.id, post]));
    return ids.flatMap((id) => {
      const post = byId.get(id);
      return post ? [toRemoteSong(post)] : [];
    });
  },

  async fetchSheet(sourceId) {
    const post = await fetchJson<WpPost>(
      `${API}/posts/${encodeURIComponent(sourceId)}?_fields=id,title,link,content,_links,_embedded&_embed=wp:term`,
    );
    const sheet = extractSheet(post.content?.rendered ?? '');
    if (!sheet) throw new Error('No chord sheet found on this page');
    return { ...toRemoteSong(post), body: textToChordPro(sheet.text), songKey: sheet.songKey };
  },
};
