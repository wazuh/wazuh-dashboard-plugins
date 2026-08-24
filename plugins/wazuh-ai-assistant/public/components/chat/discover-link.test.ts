import { createDiscoverUrlResolver } from './discover-link';
import { CoreStart } from '../../../../../src/core/public';
import { TableSpec } from '../../../common/types';

/**
 * Wiring tests for `createDiscoverUrlResolver` — the seam between a `TableSpec`'s recorded
 * provenance and the URL `buildDiscoverUrl` produces.
 *
 * `common/discover-url.test.ts` already covers `resolveDiscoverTimeRange`'s own precedence and
 * pinning rules in isolation. What those cannot catch is this resolver forgetting to PASS one of
 * them: dropping `effectiveRange` or `executedAt` from the call leaves every unit test green while
 * the link silently reverts to re-deriving its window from the DSL. Hence these assert on the final
 * `_g` time bounds, reached through the real resolver.
 *
 * Every test uses its OWN index name. `discover-link.tsx` caches index-pattern lookups in a
 * MODULE-level Map deliberately shared by every table in the chat, which does not reset between
 * tests — reusing one index name would serve a later test the earlier test's cached id (and quietly
 * skip the `find` call the last test here is about).
 */

/** Minimal `CoreStart` stand-in: only the two surfaces the resolver actually touches. */
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
                    // `search` arrives quoted ("\"<index>\""); the id only has to be
                    // recognizable in the assertions, not realistic.
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
  provenance?: TableSpec['provenance'],
): TableSpec {
  return {
    columns: [],
    rows: [],
    discover: {
      index,
      // A DSL stating a DIFFERENT window from the provenance passed below, so a passing assertion
      // can only mean the provenance was the value actually used.
      dsl: { range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } },
    },
    ...(provenance ? { provenance } : {}),
  };
}

describe('createDiscoverUrlResolver', () => {
  it('threads provenance.effectiveRange into the _g time range', async () => {
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith('wazuh-findings-effective*', {
        clamped: false,
        effectiveRange: { gte: 'now-90d', lte: 'now' },
      }),
    );
    expect(url).toContain("time:(from:'now-90d',to:'now')");
    // The DSL's own narrower window must NOT be what the link opened.
    expect(url).not.toContain("from:'now-24h'");
  });

  it('threads provenance.executedAt through, pinning date-math to absolute instants', async () => {
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith('wazuh-findings-pinned*', {
        clamped: false,
        effectiveRange: { gte: 'now-90d', lte: 'now' },
        executedAt: Date.parse('2026-03-01T00:00:00.000Z'),
      }),
    );
    // Pinned, so reopening this conversation later cannot shift the window forward with the clock.
    expect(url).toContain("from:'2025-12-01T00:00:00.000Z'");
    expect(url).toContain("to:'2026-03-01T00:00:00.000Z'");
    expect(url).not.toContain('now-90d');
  });

  it('falls back to the DSL clause when the spec records no provenance', async () => {
    const url = await createDiscoverUrlResolver(coreMock())(
      specWith('wazuh-findings-dsl-only*'),
    );
    expect(url).toContain("time:(from:'now-24h',to:'now')");
  });

  it('resolves to null when no index pattern matches, rather than building a broken link', async () => {
    const url = await createDiscoverUrlResolver(coreMock({ found: false }))(
      specWith('wazuh-findings-unmatched*'),
    );
    expect(url).toBeNull();
  });
});
