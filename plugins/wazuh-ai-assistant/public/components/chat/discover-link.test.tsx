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

/** Minimal `CoreStart` stand-in: only the two surfaces the resolver actually touches. */
function coreMock(): CoreStart {
  return {
    http: { basePath: { prepend: (path: string) => `/base${path}` } },
    savedObjects: {
      client: {
        find: ({ search }: { search: string }) =>
          Promise.resolve({
            savedObjects: [
              {
                // `search` arrives quoted ("\"<index>\""); the id only has to be recognizable.
                id: `pattern-for-${search.replace(/"/g, '')}`,
                attributes: { title: search.replace(/"/g, '') },
              },
            ],
          }),
      },
    },
  } as unknown as CoreStart;
}

function specWith(index: string, dsl: Record<string, unknown>): TableSpec {
  return { columns: [], rows: [], discover: { index, dsl } };
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

  it('keeps the default-range label when the query stated no window at all', async () => {
    const link = await renderLabel(
      specWith('wazuh-findings-label-none*', { match_all: {} }),
    );
    expect(link).toHaveTextContent('Open in Discover (default range: 24h)');
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
