import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DiscoverLink, createDiscoverUrlResolver } from './discover-link';
import { CoreStart } from '../../../../../src/core/public';
import { TableSpec } from '../../../common/types';
import { UNBOUNDED_TIME_RANGE } from '../../../common/discover-url';

/**
 * The "Open in Discover" affordance, end to end: the WINDOW the link opens and the LABEL that
 * discloses whatever the link had to fill in.
 *
 * Issue #9008 review, finding 1 (found live): a DSL stating only an upper bound ("findings before
 * 2020-01-01") produced BOTH halves of the same defect at once — an inverted `_g` window
 * (`from: now-24h`, `to: <a past instant>`) that Discover shows zero rows for, and a plain "Open in
 * Discover" label that gave no hint a bound had been substituted at all. Both halves are asserted
 * here, because either one passing alone still leaves the reader misled.
 *
 * `discover-link.tsx` caches index-pattern lookups in a MODULE-level Map deliberately shared by
 * every table in the chat, which does not reset between tests — every test below therefore uses its
 * OWN index name, or a later test is served an earlier test's cached id.
 */

/** Minimal `CoreStart` stand-in: only the two surfaces the resolver actually touches. `found:
 * false` makes the index-pattern lookup come back empty, the one case that must resolve to `null`
 * rather than to a link pointing at a pattern that does not exist. */
function coreMock(options: { found: boolean } = { found: true }): CoreStart {
  return {
    http: { basePath: { prepend: (path: string) => `/base${path}` } },
    savedObjects: {
      client: {
        find: ({ search }: { search: string }) =>
          Promise.resolve({
            savedObjects: options.found
              ? [
                  {
                    // `search` arrives quoted ("\"<index>\""); the id only has to be recognizable.
                    id: `pattern-for-${search.replace(/"/g, '')}`,
                    attributes: { title: search.replace(/"/g, '') },
                  },
                ]
              : [],
          }),
      },
    },
  } as unknown as CoreStart;
}

function specWith(
  index: string,
  dsl: Record<string, unknown>,
  provenance?: TableSpec['provenance'],
): TableSpec {
  return {
    columns: [],
    rows: [],
    discover: { index, dsl },
    ...(provenance ? { provenance } : {}),
  };
}

/** Renders the button and waits for its (asynchronously resolved) label. */
async function renderLabel(spec: TableSpec): Promise<HTMLElement> {
  render(
    <DiscoverLink
      spec={spec}
      resolveDiscoverUrl={createDiscoverUrlResolver(coreMock())}
    />,
  );
  return await waitFor(() => screen.getByRole('link'));
}

describe('DiscoverLink window', () => {
  it("fills an lte-only clause's missing LOWER bound from the beginning of time, not now-24h", async () => {
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith('wazuh-findings-lte-only*', {
        bool: {
          filter: [
            { range: { '@timestamp': { lte: '2020-01-01T00:00:00.000Z' } } },
          ],
        },
      }),
    );
    expect(url).toContain(`from:'${UNBOUNDED_TIME_RANGE.from}'`);
    expect(url).toContain("to:'2020-01-01T00:00:00.000Z'");
    // The defect itself: `from: now-24h` against a past `to` is a window with no rows in it.
    expect(url).not.toContain("from:'now-24h'");
  });

  it('never produces an inverted window for an lte-only clause', async () => {
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith('wazuh-findings-not-inverted*', {
        range: { '@timestamp': { lte: '2020-01-01T00:00:00.000Z' } },
      }),
    );
    const bounds = /time:\(from:'([^']+)',to:'([^']+)'\)/.exec(url ?? '');
    expect(bounds).not.toBeNull();
    expect(Date.parse(bounds![1])).toBeLessThan(Date.parse(bounds![2]));
  });

  it('still fills a gte-only clause\'s missing UPPER bound with "now"', async () => {
    // The mirror case is deliberately UNCHANGED: a clause stating only a lower bound really does
    // mean "up to now", and that window is not inverted.
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith('wazuh-findings-gte-only*', {
        range: { '@timestamp': { gte: 'now-7d' } },
      }),
    );
    expect(url).toContain("time:(from:'now-7d',to:'now')");
  });

  // Issue #9026: the seam between a spec's recorded provenance and the URL `buildDiscoverUrl`
  // produces. `common/discover-url.test.ts` covers `resolveDiscoverTimeRange`'s precedence and
  // pinning rules in isolation; what those cannot catch is this resolver forgetting to PASS one of
  // them — dropping `effectiveRange` or `executedAt` from the call leaves every unit test green
  // while the link silently reverts to re-deriving its window from the DSL. Hence these assert on
  // the final `_g` bounds, reached through the real resolver.
  it('threads provenance.effectiveRange into the _g time range', async () => {
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith(
        'wazuh-findings-effective*',
        // A DSL stating a DIFFERENT window from the provenance, so a passing assertion can only
        // mean the recorded provenance was the value actually used.
        { range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } },
        { clamped: false, effectiveRange: { gte: 'now-90d', lte: 'now' } },
      ),
    );
    expect(url).toContain("time:(from:'now-90d',to:'now')");
    expect(url).not.toContain("from:'now-24h'");
  });

  it('threads provenance.executedAt through, pinning date-math to absolute instants', async () => {
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith(
        'wazuh-findings-pinned*',
        { range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } },
        {
          clamped: false,
          effectiveRange: { gte: 'now-90d', lte: 'now' },
          executedAt: Date.parse('2026-03-01T00:00:00.000Z'),
        },
      ),
    );
    // Pinned, so reopening this conversation later cannot shift the window forward with the clock.
    expect(url).toContain("from:'2025-12-01T00:00:00.000Z'");
    expect(url).toContain("to:'2026-03-01T00:00:00.000Z'");
    expect(url).not.toContain('now-90d');
  });

  it('falls back to the DSL clause when the spec records no provenance', async () => {
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith('wazuh-findings-dsl-only*', {
        range: { '@timestamp': { gte: 'now-24h', lte: 'now' } },
      }),
    );
    expect(url).toContain("time:(from:'now-24h',to:'now')");
  });

  it('opens a time-unbounded query on all of history, not the 24h default', async () => {
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith('wazuh-findings-unbounded*', { match_all: {} }),
    );
    expect(url).toContain(`from:'${UNBOUNDED_TIME_RANGE.from}'`);
    expect(url).not.toContain("from:'now-24h'");
  });

  it('resolves to null when no index pattern matches, rather than building a broken link', async () => {
    const url = await createDiscoverUrlResolver(coreMock({ found: false }))(
      specWith('wazuh-findings-unmatched*', { match_all: {} }),
    );
    expect(url).toBeNull();
  });
});

describe('DiscoverLink label', () => {
  it('discloses the open START of an lte-only query', async () => {
    const link = await renderLabel(
      specWith('wazuh-findings-label-lte*', {
        range: { '@timestamp': { lte: '2020-01-01T00:00:00.000Z' } },
      }),
    );
    // The date is locale-formatted, so only the disclosure wording and the year are pinned.
    expect(link).toHaveTextContent(/up to .*2020.*no start date/);
  });

  it("discloses the open END of a gte-only query, in the chip's date-math shorthand", async () => {
    // Issue #9008 review, F5: this label sits directly beside a provenance chip that renders the
    // very same bound as "7d" (tool-call-label.ts's `shortDateMath`, now shared rather than
    // re-implemented here). Spelling it "now-7d" put two renderings of one window a few pixels
    // apart.
    const link = await renderLabel(
      specWith('wazuh-findings-label-gte*', {
        range: { '@timestamp': { gte: 'now-7d' } },
      }),
    );
    expect(link).toHaveTextContent('Open in Discover (from 7d — no end date)');
    expect(link).not.toHaveTextContent('now-7d');
  });

  it('keeps the plain label when the query bounded both edges', async () => {
    const link = await renderLabel(
      specWith('wazuh-findings-label-both*', {
        range: { '@timestamp': { gte: 'now-7d', lte: 'now' } },
      }),
    );
    expect(link).toHaveTextContent('Open in Discover');
    expect(link).not.toHaveTextContent('no start date');
    expect(link).not.toHaveTextContent('no end date');
    expect(link).not.toHaveTextContent('default range');
  });

  it('says "all time" when the query stated no window at all', async () => {
    // Issue #9026 changed what this case OPENS — all of history, not a 24-hour default — so the
    // label changed with it. A "default range: 24h" wording here would now describe a window the
    // button no longer opens.
    const link = await renderLabel(
      specWith('wazuh-findings-label-none*', { match_all: {} }),
    );
    expect(link).toHaveTextContent('Open in Discover (all time)');
    expect(link).not.toHaveTextContent('default range');
  });

  it('keeps the plain label when the server recorded the window it ran', async () => {
    // Provenance case 1: nothing was filled in, so there is nothing to disclose — even though the
    // DSL alone would have read as one-sided.
    const link = await renderLabel(
      specWith(
        'wazuh-findings-label-recorded*',
        { range: { '@timestamp': { lte: '2020-01-01T00:00:00.000Z' } } },
        {
          clamped: false,
          effectiveRange: {
            gte: '2019-01-01T00:00:00.000Z',
            lte: '2020-01-01T00:00:00.000Z',
          },
        },
      ),
    );
    expect(link).toHaveTextContent('Open in Discover');
    expect(link).not.toHaveTextContent('no start date');
    expect(link).not.toHaveTextContent('all time');
  });

  it('stays short enough not to wrap the narrow (sidecar) panel button', async () => {
    // The partial-range wordings share the existing disclosure's label slot, which is a single-line
    // `EuiButtonEmpty` in the result card header — the narrow container gives it very little room.
    // A full ISO instant alone is 24 characters, hence `shortBoundLabel`'s locale-date rendering.
    const link = await renderLabel(
      specWith('wazuh-findings-label-length*', {
        range: { '@timestamp': { lte: '2020-01-01T00:00:00.000Z' } },
      }),
    );
    expect(link.textContent!.length).toBeLessThanOrEqual(60);
  });

  it('carries the full wording in `title`, since the label itself ellipses when narrow', async () => {
    const link = await renderLabel(
      specWith('wazuh-findings-label-title*', {
        range: { '@timestamp': { lte: '2020-01-01T00:00:00.000Z' } },
      }),
    );
    expect(link.getAttribute('title')).toMatch(/up to .*2020.*no start date/);
  });
});
