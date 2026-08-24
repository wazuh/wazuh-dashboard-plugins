import React, { useEffect, useState } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from '../../../../../src/core/public';
import { TableSpec } from '../../../common/types';
import {
  buildDiscoverUrl,
  hasExplicitTimeRange,
  resolveDiscoverTimeRange,
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
    // The window comes from what the server recorded executing this query, falling back to the
    // DSL's own clause and finally to an UNBOUNDED window — never to a 24-hour default that would
    // under-count the answer this link sits under. See `resolveDiscoverTimeRange`'s doc comment
    // (common/discover-url.ts) for the full precedence and why case 3 changed.
    const timeRange = resolveDiscoverTimeRange({
      dsl: spec.discover.dsl,
      effectiveRange: spec.provenance?.effectiveRange,
    });
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
 * Small "Open in Discover" action rendered in a result card's header (result-table.tsx) when its
 * spec carries `discover` (Indexer-backed tables only). Resolves the target URL eagerly on mount
 * rather than on first expand — the underlying lookup is cheap and cached (module-level Map above),
 * so there is no real cost to resolving it even for a collapsed card, and it keeps this component's
 * behavior independent of the card's own open/closed state.
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

  // A query with no recognizable time-range clause AND no server-recorded effective range had no
  // time filter at all, so `resolveDiscoverTimeRange` opens the link on all of history rather than
  // on a 24-hour default that would under-count the answer above it (issue #9008 item I5 covered
  // only the LABEL for this case; the window itself still narrowed). The label says so, because
  // "all of history" is a materially different reading experience from the bounded window every
  // other link opens — and because a reader who expected a bounded view deserves to know before
  // clicking, not after Discover has loaded the whole index.
  const isUnboundedWindow =
    !spec.provenance?.effectiveRange &&
    !hasExplicitTimeRange(spec.discover?.dsl);

  return (
    <EuiButtonEmpty
      size='xs'
      iconType='popout'
      href={url}
      target='_blank'
      rel='noopener noreferrer'
    >
      {isUnboundedWindow
        ? i18n.translate(
            'wazuhAiAssistant.resultTable.openInDiscoverFullHistory',
            { defaultMessage: 'Open in Discover (all time)' },
          )
        : i18n.translate('wazuhAiAssistant.resultTable.openInDiscover', {
            defaultMessage: 'Open in Discover',
          })}
    </EuiButtonEmpty>
  );
};
