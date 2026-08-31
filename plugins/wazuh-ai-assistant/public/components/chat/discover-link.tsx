import React, { useEffect, useState } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from '../../../../../src/core/public';
import { TableSpec } from '../../../common/types';
import {
  buildDiscoverUrl,
  describeTimeRangeCoverage,
  resolveDiscoverTimeRange,
} from '../../../common/discover-url';
import { shortDateMath } from './tool-call-label';

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
    // (common/discover-url.ts) for the full precedence and why case 3 resolves this way.
    const timeRange = resolveDiscoverTimeRange({
      dsl: spec.discover.dsl,
      effectiveRange: spec.provenance?.effectiveRange,
      // Pins date-math bounds to the instant the query ran, so a link clicked days later opens the
      // window the answer used rather than the same shorthand re-resolved against today's clock.
      // It is ALSO the reference the DSL fallback intersects its clauses against — the same one
      // executor.ts recorded the provenance with, so a multi-clause DSL mixing date-math and ISO
      // cannot resolve one way here and another way in the evidence popover.
      executedAt: spec.provenance?.executedAt,
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
 * Short rendering of the ONE bound a one-sided range clause stated, for the partial-range
 * disclosure below.
 *
 * A date-math bound goes through `shortDateMath` — the SAME shorthand the provenance chip beside
 * this button renders its window with, so `now-90d` reads "90d" in both
 * places rather than "90d" on the chip and "now-90d" one control away. `now` itself is not that
 * shape and stays literal.
 *
 * An ISO instant becomes a locale date with NO time-of-day, unlike tool-call-label.ts's
 * `formatInstant` which needs it: this string goes inside a button label that already carries
 * "Open in Discover" plus the disclosure wording, and the whole label has to stay short enough not
 * to wrap in the narrow (sidecar) panel — a full ISO instant alone is 24 characters.
 *
 * The locale is OSD's own (`i18n.getLocale()`, guarded exactly as conversation-list.tsx's
 * `formatRelativeTime` guards it — the test environment's i18n stub does not implement it), NOT
 * `undefined`, which would hand `Intl` the host's locale and print an English month name inside a
 * Spanish sentence. Anything unparseable is passed through untouched
 * rather than guessed at.
 */
function shortBoundLabel(value: string): string {
  const dateMath = shortDateMath(value);
  if (dateMath) {
    return dateMath;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  const locale =
    typeof i18n.getLocale === 'function' ? i18n.getLocale() : undefined;
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(parsed));
  } catch {
    // Same defensive shape as `formatRelativeTime`: an unsupported locale tag must never take the
    // whole result card's header down with it.
    return new Date(parsed).toLocaleDateString();
  }
}

/**
 * The button's label. It describes the window `resolveDiscoverTimeRange` (common/discover-url.ts)
 * ACTUALLY OPENS, case for case — the two are read together deliberately, because a label that
 * disclosed one window while its own button opened another would be worse than no label at all:
 *
 *  - A server-recorded `effectiveRange` (that function's case 1) — the link opens exactly the
 *    window the executor observed running, the same fact the evidence popover states. Nothing was
 *    filled in, so there is nothing to disclose and the plain label stands. (A clamp, if one fired,
 *    is disclosed by the provenance chip's own badge rather than here.)
 *  - No recorded range, and the DSL bounded BOTH edges (`stated`) — same story, plain label.
 *  - No recorded range, and a ONE-SIDED clause (`openStart`/`openEnd`, e.g. "findings before X").
 *    The plain label alone is not enough here: the missing bound is filled from `now-24h`, so an
 *    `lte`-only clause bounded in the past would open an inverted window Discover shows nothing
 *    for. The fill direction is fixed in `UNBOUNDED_TIME_RANGE`; this says out loud which edge the
 *    query left open.
 *  - No recorded range and no clause at all (`defaulted`) — the link opens ALL OF
 *    HISTORY, because a query with no time filter really did cover the whole index and a 24-hour
 *    default under-counted the answer above it. "All time" is a materially different reading
 *    experience from every other link here, and a reader deserves to know that before clicking
 *    rather than after Discover has loaded the whole index.
 *
 * Every wording shares this one label slot and style — no second UI element — and stays short
 * enough not to wrap in the narrow (sidecar) panel.
 */
function discoverLinkLabel(spec: TableSpec): string {
  const plainLabel = (): string =>
    i18n.translate('wazuhAiAssistant.resultTable.openInDiscover', {
      defaultMessage: 'Open in Discover',
    });
  // Case 1: the server recorded the window it ran, so the link reproduces it verbatim.
  if (spec.provenance?.effectiveRange) {
    return plainLabel();
  }
  const { coverage, statedBound } = describeTimeRangeCoverage(
    spec.discover?.dsl,
    spec.provenance?.executedAt,
  );
  switch (coverage) {
    case 'defaulted': {
      return i18n.translate(
        'wazuhAiAssistant.resultTable.openInDiscoverFullHistory',
        { defaultMessage: 'Open in Discover (all time)' },
      );
    }
    case 'openStart': {
      return i18n.translate(
        'wazuhAiAssistant.resultTable.openInDiscoverOpenStart',
        {
          defaultMessage: 'Open in Discover (up to {bound} — no start date)',
          values: { bound: shortBoundLabel(statedBound ?? '') },
        },
      );
    }
    case 'openEnd': {
      return i18n.translate(
        'wazuhAiAssistant.resultTable.openInDiscoverOpenEnd',
        {
          defaultMessage: 'Open in Discover (from {bound} — no end date)',
          values: { bound: shortBoundLabel(statedBound ?? '') },
        },
      );
    }
    default: {
      return plainLabel();
    }
  }
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

  // One label slot, four wordings, read off the SAME spec (and so the same `effectiveRange` and
  // `executedAt`) the href above was resolved from — see `discoverLinkLabel` for how each case
  // maps onto the window `resolveDiscoverTimeRange` actually opens.
  const label = discoverLinkLabel(spec);

  return (
    <EuiButtonEmpty
      size='xs'
      iconType='popout'
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      // The label ellipses in a narrow container (result-table.scss's `.wzResultsCardActions`),
      // so the full wording has to stay reachable somewhere: `title` is that somewhere, and it
      // costs nothing when the label fits.
      title={label}
    >
      {label}
    </EuiButtonEmpty>
  );
};
