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
  mapCaseManagement,
  mapAnsweredFindings,
  mapIncidentResponse,
  mapSeriousFindings,
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

    it('leaves the score undefined when there are no passed or failed checks', () => {
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
      expect(tiles.score).toBeUndefined();
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

  describe('mapCaseManagement', () => {
    it('maps the total, the status counts and the open severity split', () => {
      expect(
        mapCaseManagement({
          hits: { total: 15 },
          aggregations: {
            case_status: {
              buckets: {
                active: { doc_count: 3 },
                acknowledged: { doc_count: 1 },
                completed: { doc_count: 9 },
              },
            },
            open_cases: {
              case_severity: {
                buckets: { critical: { doc_count: 1 }, high: { doc_count: 3 } },
              },
            },
            attention_cases: {
              doc_count: 2,
              attention_top: {
                hits: {
                  hits: [
                    {
                      _id: 'c1',
                      _source: {
                        wazuh: {
                          case: {
                            title: 'Brute force',
                            severity: 'critical',
                            priority: 'urgent',
                            updated_at: '2026-11-18T10:00:00Z',
                          },
                          agent: { name: 'web-01' },
                        },
                      },
                    },
                    {
                      _id: 'c2',
                      _source: {
                        wazuh: {
                          case: {
                            title: 'Never updated',
                            created_at: '2026-11-17T10:00:00Z',
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        } as never),
      ).toEqual({
        // Includes the statuses without a tile (audit, error, deleted).
        total: 15,
        byStatus: { active: 3, acknowledged: 1, completed: 9 },
        openBySeverity: {
          critical: 1,
          high: 3,
          medium: undefined,
          low: undefined,
          informational: undefined,
        },
        attention: {
          total: 2,
          cases: [
            {
              id: 'c1',
              title: 'Brute force',
              severity: 'critical',
              priority: 'urgent',
              updatedAt: '2026-11-18T10:00:00Z',
              agentName: 'web-01',
            },
            {
              id: 'c2',
              title: 'Never updated',
              severity: undefined,
              priority: undefined,
              // Falls back to the creation date.
              updatedAt: '2026-11-17T10:00:00Z',
              agentName: undefined,
            },
          ],
        },
      });
    });

    it('returns no counts on an empty response', () => {
      expect(mapCaseManagement(undefined)).toEqual({
        total: undefined,
        byStatus: {
          active: undefined,
          acknowledged: undefined,
          completed: undefined,
        },
        openBySeverity: {
          critical: undefined,
          high: undefined,
          medium: undefined,
          low: undefined,
          informational: undefined,
        },
        attention: { total: undefined, cases: [] },
      });
    });
  });

  describe('mapSeriousFindings', () => {
    it('maps the counts per level and the top rules, keeping the level of each', () => {
      expect(
        mapSeriousFindings({
          serious_findings: {
            by_level: {
              buckets: [
                {
                  key: 'high',
                  doc_count: 40,
                  by_rule: {
                    sum_other_doc_count: 0,
                    buckets: [
                      {
                        key: 'r2',
                        doc_count: 40,
                        rule_title: { buckets: [{ key: 'Brute force' }] },
                      },
                    ],
                  },
                },
                {
                  key: 'critical',
                  doc_count: 5,
                  by_rule: {
                    sum_other_doc_count: 3,
                    buckets: [{ key: 'r1', doc_count: 5 }],
                  },
                },
              ],
            },
          },
        } as never),
      ).toEqual({
        byLevel: { high: 40, critical: 5 },
        rules: [
          { id: 'r2', title: 'Brute force', level: 'high', count: 40 },
          // No title bucket: the id stands in.
          { id: 'r1', title: 'r1', level: 'critical', count: 5 },
        ],
        // Critical has rules past the top ones.
        partial: true,
      });
    });

    it('returns nothing on an empty response', () => {
      expect(mapSeriousFindings(undefined)).toEqual({
        byLevel: {},
        rules: [],
        partial: false,
      });
    });
  });

  describe('mapIncidentResponse', () => {
    it('maps the total and the ids of the answered findings', () => {
      expect(
        mapIncidentResponse({
          hits: { total: 250 },
          aggregations: {
            answered_findings: {
              answered_ids: {
                sum_other_doc_count: 2,
                buckets: [{ key: 'f1' }, { key: 'f2' }],
              },
            },
          },
        } as never),
      ).toEqual({
        total: 250,
        answeredIds: ['f1', 'f2'],
        // More ids exist than the search returned.
        answeredIdsPartial: true,
      });
    });

    it('returns no ids on an empty response', () => {
      expect(mapIncidentResponse(undefined)).toEqual({
        total: undefined,
        answeredIds: [],
        answeredIdsPartial: false,
      });
    });
  });

  describe('mapAnsweredFindings', () => {
    it('maps the answered findings per level and per rule', () => {
      expect(
        mapAnsweredFindings({
          answered_findings: {
            by_level: {
              buckets: [
                { key: 'critical', doc_count: 4 },
                // Not a level the coverage tracks.
                { key: 'medium', doc_count: 9 },
              ],
            },
            by_rule: { buckets: [{ key: 'r1', doc_count: 4 }] },
          },
        } as never),
      ).toEqual({ byLevel: { critical: 4 }, byRule: { r1: 4 } });
    });

    it('returns nothing on an empty response', () => {
      expect(mapAnsweredFindings(undefined)).toEqual({
        byLevel: {},
        byRule: {},
      });
    });
  });
});
