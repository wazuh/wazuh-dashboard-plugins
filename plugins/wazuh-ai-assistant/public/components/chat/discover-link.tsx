import React, { useEffect, useState } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from '../../../../../src/core/public';
import { TableSpec } from '../../../common/types';
import {
  buildDiscoverUrl,
  DEFAULT_TIME_RANGE,
  describeTimeRangeCoverage,
  extractTimeRange,
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
    // `provenance.executedAt` is the reference the SERVER resolved this DSL's own window against
    // when it recorded `provenance.effectiveRange` (executor.ts). Passing it back in is what makes
    // the window this link opens and the window the evidence popover states the same computation
    // over the same clauses — a multi-clause DSL whose bounds mix date-math and ISO can only be
    // intersected identically on both sides if both sides order it against the same instant
    // (issue #9008 review, F1). Absent on a conversation persisted before that field existed, in
    // which case both sides fall back to the same unordered result.
    const timeRange = extractTimeRange(
      spec.discover.dsl,
      spec.provenance?.executedAt,
    );
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
 * Short rendering of the ONE bound a one-sided range clause stated, for the partial-range
 * disclosure below.
 *
 * A date-math bound goes through `shortDateMath` — the SAME shorthand the provenance chip beside
 * this button renders its window with (issue #9008 review, F5), so `now-90d` reads "90d" in both
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
 * Spanish sentence (issue #9008 review, F4). Anything unparseable is passed through untouched
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
 * The button's label, disclosing whatever the link had to fill in that the query did not state
 * (`describeTimeRangeCoverage`, common/discover-url.ts):
 *
 *  - `stated` — the query bounded both edges, so the link opens exactly the window it ran against
 *    and there is nothing to disclose.
 *  - `defaulted` — no range clause at all, so the whole window is `DEFAULT_TIME_RANGE`. Issue #9008
 *    (I5): the QA E2E review's broader claim that this link "hardcodes now-24h" was checked and is
 *    inaccurate; the real, narrower gap was that this one case looked identical to every other
 *    link, giving no hint the window it opens may not match the one the answer above it used.
 *  - `openStart`/`openEnd` — a ONE-SIDED clause ("findings before X"). Issue #9008 review, finding
 *    1: this case used to render the plain label, because the query HAD stated a window and the
 *    default-range check only fires when none was stated at all. Worse, the missing lower bound was
 *    filled from `now-24h`, so an `lte`-only clause bounded in the past opened an inverted window
 *    Discover showed nothing for. The fill direction is fixed in `UNBOUNDED_TIME_RANGE`; this says
 *    out loud which edge the query left open, in the same label slot and style as the other
 *    disclosure (no second UI element), and short enough not to wrap in the narrow panel.
 */
function discoverLinkLabel(
  dsl: Record<string, unknown> | undefined,
  executedAt: number | undefined,
): string {
  const { coverage, statedBound } = describeTimeRangeCoverage(dsl, executedAt);
  switch (coverage) {
    case 'defaulted': {
      return i18n.translate(
        'wazuhAiAssistant.resultTable.openInDiscoverDefaultRange',
        {
          defaultMessage: 'Open in Discover (default range: {window})',
          values: { window: defaultRangeWindowLabel() },
        },
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
      return i18n.translate('wazuhAiAssistant.resultTable.openInDiscover', {
        defaultMessage: 'Open in Discover',
      });
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

  // One label slot, four wordings — see `discoverLinkLabel` above for what each discloses. Same
  // `executedAt` reference the href was resolved with, so the label can only ever describe the
  // window this button actually opens.
  const label = discoverLinkLabel(
    spec.discover?.dsl,
    spec.provenance?.executedAt,
  );

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
