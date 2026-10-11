import type { SongSource } from '@/db/schema';
import { accordiespartiti } from './accordiespartiti';
import { psicoaccordi } from './psicoaccordi';
import type { SourceAdapter } from './types';
import { ultimateguitar } from './ultimateguitar';

// Search order: Italian catalogue first, then the cartoon niche, then the
// big international one.
export const SOURCES: SourceAdapter[] = [accordiespartiti, psicoaccordi, ultimateguitar];

export function getSource(id: SongSource | string): SourceAdapter | undefined {
  return SOURCES.find((source) => source.id === id);
}
