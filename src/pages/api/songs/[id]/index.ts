import type { APIRoute } from 'astro';
import { getDb } from '@/db/client';
import { textToChordPro } from '@/lib/chords/importText';
import { json, jsonError, parseId, readJsonObject } from '@/lib/http';
import { deleteSong, getSong, updateSong } from '@/lib/songs';
import { readSongFields } from '@/lib/validate';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const id = parseId(params.id);
  if (!id) return jsonError('invalid id', 400);
  const body = await readJsonObject(request);
  if (!body) return jsonError('invalid body', 400);
  const fields = readSongFields(body);
  if (typeof fields === 'string') return jsonError(fields, 400);

  const db = getDb(locals.runtime.env.DB);
  if (!(await getSong(db, id))) return jsonError('not found', 404);
  await updateSong(db, id, { ...fields, body: textToChordPro(fields.body) });
  return json({ id });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const id = parseId(params.id);
  if (!id) return jsonError('invalid id', 400);
  await deleteSong(getDb(locals.runtime.env.DB), id);
  return json({ ok: true });
};
