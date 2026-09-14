import { Type } from '@angular/core';

import { TlsVisual } from './tls-ssl/tls-visual';

/**
 * Maps a concept id to the standalone component that renders its
 * "Visualize it" section. A concept with authored content but no entry
 * here falls back to a plain static diagram built from its how-it-works
 * steps instead.
 */
export const CONCEPT_VISUALS: Record<string, Type<unknown>> = {
  'backend-tls-ssl': TlsVisual,
};
