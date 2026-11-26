// Fixtures use the API snake_case names (external_id, must_not)
/* eslint-disable camelcase */
import {
  OTHER_AGGREGATION_KEY,
  OTHER_FILTER_LABEL,
  TECHNIQUE_FIELD,
  buildOtherAggregation,
  buildOtherFilter,
  getCatalogTechniqueIds,
  sortWithOtherLast,
} from './other-technique';

describe('other-technique', () => {
  it('collects the catalog IDs including sub-techniques, without duplicates', () => {
    const ids = getCatalogTechniqueIds([
      { source: 'mitre-attack', external_id: 'T1059' },
      { source: 'mitre-attack', external_id: 'T1059.001' },
      { source: 'mitre-attack', external_id: 'T1059' },
      {
        source: 'other',
        references: [{ source: 'mitre-attack', external_id: 'T1003' }],
      },
      { source: 'other', references: [] },
    ]);
    expect(ids).toEqual(['T1059', 'T1059.001', 'T1003']);
  });

  it('builds a filter aggregation: exists AND NOT terms(catalog)', () => {
    const agg = buildOtherAggregation(['T1059', 'T1003']);
    expect(agg[OTHER_AGGREGATION_KEY].filter).toEqual({
      bool: {
        must: [{ exists: { field: TECHNIQUE_FIELD } }],
        must_not: [{ terms: { [TECHNIQUE_FIELD]: ['T1059', 'T1003'] } }],
      },
    });
  });

  it('builds a labeled DSL filter that can be negated', () => {
    const filter = buildOtherFilter('pattern-id', ['T1059'], true);
    expect(filter.meta).toMatchObject({
      alias: OTHER_FILTER_LABEL,
      negate: true,
      index: 'pattern-id',
      type: 'custom',
    });
    expect(filter.query.bool.must_not[0].terms[TECHNIQUE_FIELD]).toEqual([
      'T1059',
    ]);
  });

  it('sorts by count and pins Other at the end whatever its count', () => {
    const result = sortWithOtherLast(
      [
        { id: 'T1', quantity: 1 },
        { id: 'T2', quantity: 5 },
      ],
      { id: 'other', quantity: 100 },
    );
    expect(result.map(item => item.id)).toEqual(['T2', 'T1', 'other']);
  });

  it('returns only the sorted techniques when there is no Other item', () => {
    expect(
      sortWithOtherLast([
        { id: 'a', quantity: 1 },
        { id: 'b', quantity: 2 },
      ]).map(i => i.id),
    ).toEqual(['b', 'a']);
  });
});
