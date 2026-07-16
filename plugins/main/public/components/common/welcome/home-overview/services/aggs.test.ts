/* eslint-disable camelcase */
import {
  buildSeverityFiltersAgg,
  buildTopTermsAgg,
  buildFindingsOverviewAggs,
  SEVERITY_BANDS,
  FINDING_SEVERITY_FIELD,
  MITRE_TACTIC_NAME_FIELD,
} from './aggs';

describe('aggs builders', () => {
  it('builds one filters-agg bucket per severity band', () => {
    const agg = buildSeverityFiltersAgg();
    const filters = agg.severity.filters.filters;
    expect(Object.keys(filters).sort()).toEqual([...SEVERITY_BANDS].sort());
    expect(filters.critical).toEqual({
      match_phrase: { [FINDING_SEVERITY_FIELD]: 'critical' },
    });
  });

  it('builds a terms agg with the given name, field and size', () => {
    expect(buildTopTermsAgg('top_os', 'host.os.name', 5)).toEqual({
      top_os: { terms: { field: 'host.os.name', size: 5 } },
    });
  });

  it('batches severity + top tactics into a single findings agg object', () => {
    const aggs = buildFindingsOverviewAggs(7);
    expect(aggs.severity).toBeDefined();
    expect(aggs.tactics).toEqual({
      terms: { field: MITRE_TACTIC_NAME_FIELD, size: 7 },
    });
  });
});
