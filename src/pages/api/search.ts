import type { APIRoute } from 'astro';
import { getDb } from '@/db/client';
import type { SourceResults } from '@/lib/catalog';
import { json } from '@/lib/http';
import { findBySource } from '@/lib/songs';
import { SOURCES } from '@/lib/sources/registry';

export const prerender = false;

// Searches every source in parallel; one failing source never hides the
// others' results.
export const GET: APIRoute = async ({ url, locals }) => {
  const query = url.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 100) return json({ sources: [] });
  const db = getDb(locals.runtime.env.DB);

  const sources = await Promise.all(
    SOURCES.map(async (source): Promise<SourceResults> => {
      try {
        const remote = await source.search(query);
        const known = await findBySource(
          db,
          source.id,
          remote.map((song) => song.sourceId),
        );
        return {
          source: source.id,
          name: source.name,
          results: remote.map((song) => ({ ...song, songId: known.get(song.sourceId) ?? null })),
          error: null,
        };
      } catch (error) {
        return {
          source: source.id,
          name: source.name,
          results: [],
          error: error instanceof Error ? error.message : 'search failed',
        };
      }
    }),
  );
  return json({ sources });
};
