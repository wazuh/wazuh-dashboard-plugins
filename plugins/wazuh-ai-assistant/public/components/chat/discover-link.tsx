import React, { useEffect, useState } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from '../../../../../src/core/public';
import { TableSpec } from '../../../common/types';
import {
  buildDiscoverUrl,
  extractTimeRange,
} from '../../../common/discover-url';

export type ResolveDiscoverUrl = (spec: TableSpec) => Promise<string | null>;

/**
 * index name -> saved-object id of its index-pattern, or `null` when none could be resolved.
 * Module-level (not per-component, not per-resolver-instance) so every table in the whole chat —
 * across turns, across bubbles — shares one lookup per distinct index, per the feature brief.
 * Caches the in-flight Promise itself (not just its settled value) so two tables mounting for the
 * same index back-to-back still only issue one `savedObjects.client.find` call.
 */
const indexPatternIdCache = new Map<string, Promise<string | null>>();

/** Resolves `index` (a concrete index name/pattern, e.g. "wazuh-alerts-*") to the saved-object id
 * of the matching index-pattern, favoring an exact `attributes.title` match and otherwise falling
 * back to the first hit `find` returned; `null` when the search itself found nothing. */
function resolveIndexPatternId(
  core: CoreStart,
  index: string,
): Promise<string | null> {
  const cached = indexPatternIdCache.get(index);
  if (cached) {
    return cached;
  }
  const lookup = core.savedObjects.client
    .find<{ title: string }>({
      type: 'index-pattern',
      search: `"${index}"`,
      searchFields: ['title'],
      perPage: 10,
    })
    .then(response => {
      const exact = response.savedObjects.find(
        object => object.attributes.title === index,
      );
      const chosen = exact ?? response.savedObjects[0];
      return chosen?.id ?? null;
    })
    .catch(() => null);
  indexPatternIdCache.set(index, lookup);
  return lookup;
}

/**
 * Builds the one `resolveDiscoverUrl` callback threaded down through MessageList/MessageBubble/
 * ResultTable to every DiscoverLink instance — created once in chat-page.tsx (with `core` in
 * closure) rather than passing `core` itself all the way down, keeping the prop plumbing to a
 * single typed function.
 */
export function createDiscoverUrlResolver(core: CoreStart): ResolveDiscoverUrl {
  return async (spec: TableSpec): Promise<string | null> => {
    if (!spec.discover) {
      return null;
    }
    const indexPatternId = await resolveIndexPatternId(
      core,
      spec.discover.index,
    );
    if (!indexPatternId) {
      return null;
    }
    const discoverAppUrl = core.http.basePath.prepend(
      '/app/data-explorer/discover',
    );
    const timeRange = extractTimeRange(spec.discover.dsl);
    return buildDiscoverUrl({
      discoverAppUrl,
      indexPatternId,
      dsl: spec.discover.dsl,
      timeRange,
    });
  };
}

interface DiscoverLinkProps {
  spec: TableSpec;
  resolveDiscoverUrl: ResolveDiscoverUrl;
}

/**
 * Small "Open in Discover" action rendered next to a result table (result-table.tsx's accordion
 * `extraAction`) when its spec carries `discover` (Indexer-backed tables only). Resolves the target
 * URL eagerly on mount rather than on first expand — the underlying lookup is cheap and cached
 * (module-level Map above), so there is no real cost to resolving it even for a collapsed table,
 * and it keeps this component's behavior independent of the accordion's own open/closed state.
 * Renders nothing until resolved, and nothing (silently) if resolution fails — the table itself
 * always renders regardless, this is purely an optional affordance on top of it.
 */
export const DiscoverLink: React.FC<DiscoverLinkProps> = ({
  spec,
  resolveDiscoverUrl,
}) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveDiscoverUrl(spec).then(resolved => {
      if (!cancelled) {
        setUrl(resolved);
      }
    });
    return () => {
      cancelled = true;
    };
    // `spec` identity changes per stream turn (a fresh TableSpec object each time), which is
    // exactly when this should re-resolve — e.g. a later tool call in the same bubble against a
    // different index.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  if (!url) {
    return null;
  }

  return (
    <EuiButtonEmpty
      size='xs'
      iconType='popout'
      href={url}
      target='_blank'
      rel='noopener noreferrer'
    >
      {i18n.translate('wazuhAiAssistant.resultTable.openInDiscover', {
        defaultMessage: 'Open in Discover',
      })}
    </EuiButtonEmpty>
  );
};
