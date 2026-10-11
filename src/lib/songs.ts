import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { type NewSong, type Song, type SongSource, songs } from '@/db/schema';

export type SongSummary = Pick<Song, 'id' | 'title' | 'artist' | 'songKey'>;

export type SongPrefs = Pick<Song, 'transpose' | 'simplify' | 'scrollSpeed'>;

export type SongFields = Pick<Song, 'title' | 'artist' | 'songKey' | 'body'>;

export async function listSongs(db: Db): Promise<SongSummary[]> {
  return db
    .select({ id: songs.id, title: songs.title, artist: songs.artist, songKey: songs.songKey })
    .from(songs)
    .orderBy(asc(songs.artist), asc(songs.title));
}

export async function getSong(db: Db, id: number): Promise<Song | undefined> {
  return db.select().from(songs).where(eq(songs.id, id)).get();
}

export async function findBySource(
  db: Db,
  source: SongSource,
  sourceIds: string[],
): Promise<Map<string, number>> {
  if (sourceIds.length === 0) return new Map();
  const rows = await db
    .select({ id: songs.id, sourceId: songs.sourceId })
    .from(songs)
    .where(and(eq(songs.source, source), inArray(songs.sourceId, sourceIds)));
  return new Map(rows.flatMap((row) => (row.sourceId ? [[row.sourceId, row.id] as const] : [])));
}

export async function createSong(db: Db, song: NewSong): Promise<number> {
  const row = await db.insert(songs).values(song).returning({ id: songs.id }).get();
  return row.id;
}

export async function updateSong(db: Db, id: number, fields: Partial<SongFields & SongPrefs>) {
  await db
    .update(songs)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(eq(songs.id, id));
}

export async function deleteSong(db: Db, id: number) {
  await db.delete(songs).where(eq(songs.id, id));
}
