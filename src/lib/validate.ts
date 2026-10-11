import type { SongFields, SongPrefs } from './songs';

const MAX_BODY = 50_000;

function optionalString(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > max) throw new Error('invalid string');
  return value.trim();
}

export function readSongFields(body: Record<string, unknown>): SongFields | string {
  try {
    const title = optionalString(body.title, 200);
    const artist = optionalString(body.artist, 200) ?? '';
    const songKey = optionalString(body.songKey, 12) || null;
    const sheet = optionalString(body.body, MAX_BODY);
    if (!title) return 'title is required';
    if (!sheet) return 'sheet is required';
    return { title, artist, songKey, body: sheet };
  } catch {
    return 'invalid fields';
  }
}

export function readSongPrefs(body: Record<string, unknown>): Partial<SongPrefs> | string {
  const prefs: Partial<SongPrefs> = {};
  if (body.transpose !== undefined) {
    if (!Number.isInteger(body.transpose) || Math.abs(Number(body.transpose)) > 11) return 'invalid transpose';
    prefs.transpose = Number(body.transpose);
  }
  if (body.simplify !== undefined) {
    if (typeof body.simplify !== 'boolean') return 'invalid simplify';
    prefs.simplify = body.simplify;
  }
  if (body.scrollSpeed !== undefined) {
    const speed = Number(body.scrollSpeed);
    if (!Number.isInteger(speed) || speed < 1 || speed > 10) return 'invalid scrollSpeed';
    prefs.scrollSpeed = speed;
  }
  return prefs;
}
