import type { APIRoute } from 'astro';
import { getDb } from '@/db/client';
import { json, jsonError, parseId } from '@/lib/http';
import { getSong, updateSong } from '@/lib/songs';
import { getSource } from '@/lib/sources/registry';

export const prerender = false;

// Re-imports the sheet from its source, so parser improvements reach songs
// already in the library. Viewer preferences are kept; manual edits to the
// sheet are replaced.
export const POST: APIRoute = async ({ params, locals }) => {
  const id = parseId(params.id);
  if (!id) return jsonError('invalid id', 400);
  const db = getDb(locals.runtime.env.DB);
  const song = await getSong(db, id);
  if (!song) return jsonError('not found', 404);
  const source = getSource(song.source);
  if (!source || !song.sourceId) return jsonError('song has no source', 400);

  try {
    const sheet = await source.fetchSheet(song.sourceId);
    await updateSong(db, id, { body: sheet.body, songKey: sheet.songKey });
    return json({ id });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'refresh failed', 502);
  }
};
