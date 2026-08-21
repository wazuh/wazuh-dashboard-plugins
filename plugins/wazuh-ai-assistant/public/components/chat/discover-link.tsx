import React, { useEffect, useState } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from '../../../../../src/core/public';
import { TableSpec } from '../../../common/types';
import {
  buildDiscoverUrl,
  DEFAULT_TIME_RANGE,
  extractTimeRange,
  hasExplicitTimeRange,
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

/** `now-24h` -> "24h": the same date-math shorthand every other window label in this plugin uses
 * (tool-call-label.ts's `shortDateMath`). Derived from `DEFAULT_TIME_RANGE.from`
 * (common/discover-url.ts) rather than a hardcoded "24h" literal, so the fallback label can never
 * silently drift from the actual default window it is describing. Falls back to the raw
 * date-math string on the off chance `DEFAULT_TIME_RANGE` ever stops being that shape. */
function defaultRangeWindowLabel(): string {
  const match = /^now-(\d+[dhm])$/.exec(DEFAULT_TIME_RANGE.from);
  return match ? match[1] : DEFAULT_TIME_RANGE.from;
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

  // Issue #9008 (I5): `resolveDiscoverUrl` (above) falls back to the last-24h default window
  // ONLY when `spec.discover.dsl` carries no explicit, recognizable time-range clause at all
  // (`hasExplicitTimeRange` / `extractTimeRange`, common/discover-url.ts) — every other query
  // opens Discover to the SAME window it actually ran against. The QA E2E review's broader claim
  // that this link "hardcodes now-24h" was checked and is inaccurate; the real, narrower gap is
  // that this range-less fallback case looked identical to every other link, giving no hint the
  // window it opens to may not match the one the answer above it used.
  const isRangeLessFallback = !hasExplicitTimeRange(spec.discover?.dsl);

  return (
    <EuiButtonEmpty
      size='xs'
      iconType='popout'
      href={url}
      target='_blank'
      rel='noopener noreferrer'
    >
      {isRangeLessFallback
        ? i18n.translate(
            'wazuhAiAssistant.resultTable.openInDiscoverDefaultRange',
            {
              defaultMessage: 'Open in Discover (last {window})',
              values: { window: defaultRangeWindowLabel() },
            },
          )
        : i18n.translate('wazuhAiAssistant.resultTable.openInDiscover', {
            defaultMessage: 'Open in Discover',
          })}
    </EuiButtonEmpty>
  );
};
