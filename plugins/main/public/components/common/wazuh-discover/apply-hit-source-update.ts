/*
 * Wazuh app - Apply an optimistic update onto an inspected document hit
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Returns a new hit with `sourceUpdate` applied onto its `_source`, used to keep
 * the open document flyout in sync with a mutation (e.g. a case create/edit/clean)
 * without waiting for the index to refresh.
 *
 * Top level keys of `_source` are merged; nested plain object values are
 * shallow merged one level (so `{ wazuh: { case } }` replaces `wazuh.case` while
 * keeping `wazuh.agent`, etc.). A `null`, array or primitive value replaces the
 * existing value wholesale, this is required so a "clean" can drop the case.
 *
 * The input hit is never mutated. Returns the hit unchanged when it is falsy.
 */
export function applyHitSourceUpdate<
  T extends { _source?: Record<string, unknown> },
>(hit: T | undefined, sourceUpdate: Record<string, unknown>): T | undefined {
  if (!hit) {
    return hit;
  }

  const source: Record<string, unknown> = { ...hit._source };

  for (const [key, value] of Object.entries(sourceUpdate)) {
    source[key] =
      isPlainObject(value) && isPlainObject(source[key])
        ? { ...(source[key] as Record<string, unknown>), ...value }
        : value;
  }

  return { ...hit, _source: source };
}

/**
 * Applies `sourceUpdate` to the hit matching `documentId` inside a search response,
 * mirroring the optimistic flyout update onto the data grid so both stay consistent
 * without waiting for the index to refresh. Returns a new response (the input is never
 * mutated); when no hit matches, the response is returned unchanged.
 */
export function applyResultsSourceUpdate<
  R extends {
    hits?: {
      hits?: Array<{ _id?: string; _source?: Record<string, unknown> }>;
    };
  },
>(results: R, documentId: string, sourceUpdate: Record<string, unknown>): R {
  const hits = results?.hits?.hits;

  if (!hits?.length) {
    return results;
  }

  return {
    ...results,
    hits: {
      ...results.hits,
      hits: hits.map(hit =>
        hit?._id === documentId ? applyHitSourceUpdate(hit, sourceUpdate) : hit,
      ),
    },
  };
}
