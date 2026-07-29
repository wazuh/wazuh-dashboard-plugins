/* eslint-disable camelcase */
import {
  mapSeverityCounts,
  mapTopBuckets,
  mapAgentStatus,
  mapCardinality,
  mapCloudSecurityByModule,
  mapDocCount,
  mapScaTiles,
  mapScaBenchmarks,
} from './mappers';
import { VULNERABILITY_SEVERITY_BANDS } from './fields';

describe('mappers', () => {
  describe('mapSeverityCounts', () => {
    it('reads doc_count for each finding band, including informational', () => {
      const aggregations = {
        severity: {
          buckets: {
            critical: { doc_count: 179 },
            high: { doc_count: 5456 },
            medium: { doc_count: 31517 },
            low: { doc_count: 1980 },
            informational: { doc_count: 42 },
          },
        },
      };
      expect(mapSeverityCounts(aggregations)).toEqual({
        critical: 179,
        high: 5456,
        medium: 31517,
        low: 1980,
        informational: 42,
      });
    });

    it('leaves absent bands undefined, keeps explicit 0', () => {
      const empty = mapSeverityCounts(undefined);
      expect(empty.critical).toBeUndefined();
      expect(empty.high).toBeUndefined();

      const partial = mapSeverityCounts({
        severity: {
          buckets: { high: { doc_count: 3 }, low: { doc_count: 0 } },
        },
      });
      expect(partial.high).toBe(3);
      expect(partial.low).toBe(0); // explicit 0 preserved
      expect(partial.critical).toBeUndefined(); // absent → undefined, not 0
    });
  });

  describe('mapTopBuckets', () => {
    it('maps terms buckets to {key, count}', () => {
      const aggregations = {
        tactics: {
          buckets: [
            { key: 'Initial Access', doc_count: 36231 },
            { key: 'Discovery', doc_count: 3899 },
          ],
        },
      };
      expect(mapTopBuckets(aggregations, 'tactics')).toEqual([
        { key: 'Initial Access', count: 36231 },
        { key: 'Discovery', count: 3899 },
      ]);
    });

    it('returns an empty array when the agg is missing', () => {
      expect(mapTopBuckets(undefined, 'tactics')).toEqual([]);
      expect(mapTopBuckets({}, 'tactics')).toEqual([]);
    });
  });

  describe('mapSeverityCounts with a custom agg name and band list', () => {
    it('reads only the given bands from the named filters agg (no informational)', () => {
      const aggregations = {
        vulnerability_severity: {
          buckets: {
            critical: { doc_count: 179 },
            high: { doc_count: 5456 },
            medium: { doc_count: 31517 },
            low: { doc_count: 1980 },
            pending: { doc_count: 0 },
          },
        },
      };
      expect(
        mapSeverityCounts(
          aggregations,
          'vulnerability_severity',
          VULNERABILITY_SEVERITY_BANDS,
        ),
      ).toEqual({
        critical: 179,
        high: 5456,
        medium: 31517,
        low: 1980,
        pending: 0,
      });
    });
  });

  describe('mapCardinality', () => {
    it('reads the value of a single-value metric agg', () => {
      expect(
        mapCardinality({ techniques_count: { value: 7 } }, 'techniques_count'),
      ).toBe(7);
    });

    it('reads an explicit 0 value', () => {
      expect(
        mapCardinality({ techniques_count: { value: 0 } }, 'techniques_count'),
      ).toBe(0);
    });

    it('returns undefined when the agg is missing (no fabricated 0)', () => {
      expect(mapCardinality(undefined, 'techniques_count')).toBeUndefined();
      expect(mapCardinality({}, 'techniques_count')).toBeUndefined();
    });
  });

  describe('mapDocCount', () => {
    it('reads hits.total from a search response (incl. explicit 0)', () => {
      expect(mapDocCount({ hits: { total: 40614 } })).toBe(40614);
      expect(mapDocCount({ hits: { total: 0 } })).toBe(0);
    });

    it('returns undefined when the response is missing (no fabricated 0)', () => {
      expect(mapDocCount(undefined)).toBeUndefined();
    });
  });

  describe('mapScaTiles', () => {
    it('reads Passed/Failed/Not applicable and derives the score', () => {
      const aggregations = {
        sca_result: {
          buckets: {
            passed: { doc_count: 321 },
            failed: { doc_count: 547 },
            not_applicable: { doc_count: 52 },
          },
        },
      };
      expect(mapScaTiles(aggregations)).toEqual({
        passed: 321,
        failed: 547,
        notApplicable: 52,
        score: 321 / (321 + 547),
      });
    });

    it('scores 0 only when passed and failed are explicit 0s', () => {
      const tiles = mapScaTiles({
        sca_result: {
          buckets: {
            passed: { doc_count: 0 },
            failed: { doc_count: 0 },
            not_applicable: { doc_count: 0 },
          },
        },
      });
      expect(tiles.passed).toBe(0);
      expect(tiles.score).toBe(0);
    });

    it('leaves values and score undefined when there is no data', () => {
      const tiles = mapScaTiles(undefined);
      expect(tiles.passed).toBeUndefined();
      expect(tiles.failed).toBeUndefined();
      expect(tiles.notApplicable).toBeUndefined();
      expect(tiles.score).toBeUndefined();
    });
  });

  describe('mapScaBenchmarks', () => {
    it('derives passed/failed/score per benchmark from the nested terms agg', () => {
      const aggregations = {
        sca_benchmarks: {
          buckets: [
            {
              key: 'CIS Ubuntu Linux 24.04 LTS v1.0.0',
              result: {
                buckets: [
                  { key: 'Passed', doc_count: 200 },
                  { key: 'Failed', doc_count: 79 },
                ],
              },
            },
          ],
        },
      };
      expect(mapScaBenchmarks(aggregations)).toEqual([
        {
          name: 'CIS Ubuntu Linux 24.04 LTS v1.0.0',
          passed: 200,
          failed: 79,
          score: 200 / (200 + 79),
        },
      ]);
    });

    it('returns an empty array when the agg is missing', () => {
      expect(mapScaBenchmarks(undefined)).toEqual([]);
      expect(mapScaBenchmarks({})).toEqual([]);
    });
  });

  describe('mapCloudSecurityByModule', () => {
    it('reads doc_count per module bucket, keyed by app id', () => {
      const aggregations = {
        cloud_security_by_module: {
          buckets: {
            docker: { doc_count: 12 },
            'amazon-web-services': { doc_count: 0 },
            github: { doc_count: 3 },
          },
        },
      };
      expect(mapCloudSecurityByModule(aggregations)).toEqual({
        docker: 12,
        'amazon-web-services': 0,
        github: 3,
      });
    });

    it('returns an empty object when the agg is missing', () => {
      expect(mapCloudSecurityByModule(undefined)).toEqual({});
      expect(mapCloudSecurityByModule({})).toEqual({});
    });
  });

  describe('mapAgentStatus', () => {
    it('maps the connection payload and camelCases never_connected', () => {
      expect(
        mapAgentStatus({
          active: 5,
          disconnected: 1,
          pending: 0,
          never_connected: 2,
          total: 8,
        }),
      ).toEqual({
        active: 5,
        disconnected: 1,
        pending: 0,
        neverConnected: 2,
        total: 8,
      });
    });
  });
});
