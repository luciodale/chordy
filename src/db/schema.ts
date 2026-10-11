import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const SONG_SOURCES = ['manual', 'accordiespartiti', 'psicoaccordi', 'ultimateguitar'] as const;

export type SongSource = (typeof SONG_SOURCES)[number];

export const songs = sqliteTable(
  'songs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    artist: text('artist').notNull().default(''),
    // Original key in English notation, e.g. "C" or "Am". Drives sharp vs flat
    // spelling when transposing.
    songKey: text('song_key'),
    // The sheet, always ChordPro with English chord names.
    body: text('body').notNull(),
    source: text('source', { enum: SONG_SOURCES }).notNull().default('manual'),
    sourceId: text('source_id'),
    sourceUrl: text('source_url'),
    // Viewer preferences, per song, shared across devices.
    transpose: integer('transpose').notNull().default(0),
    simplify: integer('simplify', { mode: 'boolean' }).notNull().default(false),
    scrollSpeed: integer('scroll_speed').notNull().default(3),
    createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [uniqueIndex('songs_source_uidx').on(table.source, table.sourceId)],
);

export type Song = typeof songs.$inferSelect;

export type NewSong = typeof songs.$inferInsert;
