import type { APIRoute } from 'astro';
import { getDb } from '@/db/client';
import { json, jsonError, readJsonObject } from '@/lib/http';
import { createSong, findBySource } from '@/lib/songs';
import { getSource } from '@/lib/sources/registry';

export const prerender = false;

// Pulls one sheet from a source, converts it to ChordPro and stores it.
// Importing a song twice returns the existing one.
export const POST: APIRoute = async ({ request, locals }) => {
  const body = await readJsonObject(request);
  const source = typeof body?.source === 'string' ? getSource(body.source) : undefined;
  const sourceId = body?.sourceId;
  if (!source) return jsonError('unknown source', 400);
  if (typeof sourceId !== 'string' || !source.isValidId(sourceId)) return jsonError('invalid sourceId', 400);

  const db = getDb(locals.runtime.env.DB);
  const existing = (await findBySource(db, source.id, [sourceId])).get(sourceId);
  if (existing) return json({ id: existing });

  try {
    const sheet = await source.fetchSheet(sourceId);
    const id = await createSong(db, {
      title: sheet.title,
      artist: sheet.artist,
      songKey: sheet.songKey,
      body: sheet.body,
      source: source.id,
      sourceId: sheet.sourceId,
      sourceUrl: sheet.url,
    });
    return json({ id }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'import failed', 502);
  }
};
