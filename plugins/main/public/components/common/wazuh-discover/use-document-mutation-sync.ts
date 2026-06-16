/*
 * Wazuh app - Keep the document flyout, its grid row and the charts in sync
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { useCallback, useRef, useState } from 'react';
import {
  applyHitSourceUpdate,
  applyResultsSourceUpdate,
} from './apply-hit-source-update';

interface UseDocumentMutationSyncParams<H, R> {
  inspectedHit: H;
  setInspectedHit: React.Dispatch<React.SetStateAction<H>>;
  setResults: React.Dispatch<React.SetStateAction<R>>;
}

/**
 * Wires up the optimistic synchronization triggered when the open document is
 * mutated from its flyout (e.g. a case create/edit/clean).
 *
 * The returned `onDocumentMutated` patches both the flyout (`inspectedHit`) and
 * its row in the grid (`results`) with the returned payload so they update
 * instantly and stay consistent, and bumps `caseRefreshKey` so the consumer can
 * refresh the dashboard charts. The grid is updated optimistically here instead
 * of refetching, since a `_search` would race the index refresh.
 */
export function useDocumentMutationSync<H extends { _id?: string }, R>({
  inspectedHit,
  setInspectedHit,
  setResults,
}: UseDocumentMutationSyncParams<H, R>) {
  const [caseRefreshKey, setCaseRefreshKey] = useState(0);

  // Keep the latest inspected hit reachable from the stable mutation handler.
  const inspectedHitRef = useRef(inspectedHit);
  inspectedHitRef.current = inspectedHit;

  const onDocumentMutated = useCallback(
    (sourceUpdate?: Record<string, unknown>) => {
      if (sourceUpdate) {
        const documentId = inspectedHitRef.current?._id;
        setInspectedHit(current => applyHitSourceUpdate(current, sourceUpdate));
        if (documentId) {
          setResults(current =>
            applyResultsSourceUpdate(current, documentId, sourceUpdate),
          );
        }
      }
      setCaseRefreshKey(key => key + 1);
    },
    [setInspectedHit, setResults],
  );

  return { onDocumentMutated, caseRefreshKey };
}
