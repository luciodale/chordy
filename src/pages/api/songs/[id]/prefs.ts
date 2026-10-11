import type { APIRoute } from 'astro';
import { getDb } from '@/db/client';
import { json, jsonError, parseId, readJsonObject } from '@/lib/http';
import { updateSong } from '@/lib/songs';
import { readSongPrefs } from '@/lib/validate';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const id = parseId(params.id);
  if (!id) return jsonError('invalid id', 400);
  const body = await readJsonObject(request);
  if (!body) return jsonError('invalid body', 400);
  const prefs = readSongPrefs(body);
  if (typeof prefs === 'string') return jsonError(prefs, 400);
  await updateSong(getDb(locals.runtime.env.DB), id, prefs);
  return json({ ok: true });
};
