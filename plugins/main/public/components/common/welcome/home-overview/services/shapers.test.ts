/* eslint-disable camelcase */
import {
  shapeSeverityCounts,
  shapeTopBuckets,
  shapeAgentStatus,
} from './shapers';

describe('shapers', () => {
  describe('shapeSeverityCounts', () => {
    it('reads doc_count for each band from a filters agg', () => {
      const aggregations = {
        severity: {
          buckets: {
            critical: { doc_count: 179 },
            high: { doc_count: 5456 },
            medium: { doc_count: 31517 },
            low: { doc_count: 1980 },
          },
        },
      };
      expect(shapeSeverityCounts(aggregations)).toEqual({
        critical: 179,
        high: 5456,
        medium: 31517,
        low: 1980,
      });
    });

    it('defaults missing bands and missing aggregations to 0', () => {
      expect(shapeSeverityCounts(undefined)).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
      expect(
        shapeSeverityCounts({
          severity: { buckets: { high: { doc_count: 3 } } },
        }),
      ).toEqual({ critical: 0, high: 3, medium: 0, low: 0 });
    });
  });

  describe('shapeTopBuckets', () => {
    it('maps terms buckets to {key, count}', () => {
      const aggregations = {
        tactics: {
          buckets: [
            { key: 'Initial Access', doc_count: 36231 },
            { key: 'Discovery', doc_count: 3899 },
          ],
        },
      };
      expect(shapeTopBuckets(aggregations, 'tactics')).toEqual([
        { key: 'Initial Access', count: 36231 },
        { key: 'Discovery', count: 3899 },
      ]);
    });

    it('returns an empty array when the agg is missing', () => {
      expect(shapeTopBuckets(undefined, 'tactics')).toEqual([]);
      expect(shapeTopBuckets({}, 'tactics')).toEqual([]);
    });
  });

  describe('shapeAgentStatus', () => {
    it('maps the connection payload and camelCases never_connected', () => {
      expect(
        shapeAgentStatus({
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
      expect(shapeAgentStatus(undefined)).toEqual({
        active: 0,
        disconnected: 0,
        pending: 0,
        neverConnected: 0,
        total: 0,
      });
    });
  });
});
