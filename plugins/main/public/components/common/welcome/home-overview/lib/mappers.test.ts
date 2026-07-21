/* eslint-disable camelcase */
import {
  mapSeverityCounts,
  mapTopBuckets,
  mapAgentStatus,
  mapCardinality,
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

    it('defaults missing bands and missing aggregations to 0', () => {
      expect(mapSeverityCounts(undefined)).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        informational: 0,
      });
      expect(
        mapSeverityCounts({
          severity: { buckets: { high: { doc_count: 3 } } },
        }),
      ).toEqual({
        critical: 0,
        high: 3,
        medium: 0,
        low: 0,
        informational: 0,
      });
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
          },
        },
      };
      expect(
        mapSeverityCounts(
          aggregations,
          'vulnerability_severity',
          VULNERABILITY_SEVERITY_BANDS,
        ),
      ).toEqual({ critical: 179, high: 5456, medium: 31517, low: 1980 });
    });
  });

  describe('mapCardinality', () => {
    it('reads the value of a single-value metric agg', () => {
      expect(
        mapCardinality({ techniques_count: { value: 7 } }, 'techniques_count'),
      ).toBe(7);
    });

    it('defaults to 0 when the agg is missing', () => {
      expect(mapCardinality(undefined, 'techniques_count')).toBe(0);
      expect(mapCardinality({}, 'techniques_count')).toBe(0);
    });
  });

  describe('mapDocCount', () => {
    it('reads hits.total from a search response', () => {
      expect(mapDocCount({ hits: { total: 40614 } })).toBe(40614);
    });

    it('defaults to 0 when the response is missing', () => {
      expect(mapDocCount(undefined)).toBe(0);
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

    it('defaults to zeroes and a 0 score when there is no data', () => {
      expect(mapScaTiles(undefined)).toEqual({
        passed: 0,
        failed: 0,
        notApplicable: 0,
        score: 0,
      });
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

    it('defaults everything to 0 when payload is empty', () => {
      expect(mapAgentStatus(undefined)).toEqual({
        active: 0,
        disconnected: 0,
        pending: 0,
        neverConnected: 0,
        total: 0,
      });
    });
  });
});
