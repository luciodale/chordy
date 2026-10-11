import type { APIRoute } from 'astro';
import { getDb } from '@/db/client';
import { textToChordPro } from '@/lib/chords/importText';
import { json, jsonError, readJsonObject } from '@/lib/http';
import { createSong } from '@/lib/songs';
import { readSongFields } from '@/lib/validate';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await readJsonObject(request);
  if (!body) return jsonError('invalid body', 400);
  const fields = readSongFields(body);
  if (typeof fields === 'string') return jsonError(fields, 400);

  const id = await createSong(getDb(locals.runtime.env.DB), {
    ...fields,
    body: textToChordPro(fields.body),
  });
  return json({ id }, 201);
};
