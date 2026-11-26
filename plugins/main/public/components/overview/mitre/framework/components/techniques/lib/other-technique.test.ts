// Fixtures use the API snake_case names (external_id, must_not)
/* eslint-disable camelcase */
import {
  OTHER_AGGREGATION_KEY,
  OTHER_FILTER_LABEL,
  OTHER_TECHNIQUES_BUCKETS_KEY,
  TACTIC_FIELD,
  TECHNIQUE_FIELD,
  buildOtherAggregation,
  buildOtherFilter,
  getListedTechniqueIds,
  getSelectedTacticIds,
} from './other-technique';

const tacticsObject = {
  Persistence: { external_id: 'TA0003', techniques: ['t-1098', 't-1053'] },
  'Privilege Escalation': {
    external_id: 'TA0004',
    techniques: ['t-1134', 't-1053'],
  },
  Execution: { external_id: 'TA0002', techniques: ['t-1059'] },
};

const catalog = [
  { id: 't-1098', source: 'mitre-attack', external_id: 'T1098' },
  { id: 't-1053', source: 'mitre-attack', external_id: 'T1053' },
  {
    id: 't-1134',
    source: 'other',
    references: [{ source: 'mitre-attack', external_id: 'T1134' }],
  },
  { id: 't-1059', source: 'mitre-attack', external_id: 'T1059' },
];

describe('getSelectedTacticIds', () => {
  it('returns the ATT&CK IDs of the selected tactics', () => {
    expect(
      getSelectedTacticIds(tacticsObject, {
        Persistence: true,
        'Privilege Escalation': true,
        Execution: false,
      }),
    ).toEqual(['TA0003', 'TA0004']);
  });

  it('returns nothing when no tactic is selected', () => {
    expect(getSelectedTacticIds(tacticsObject, {})).toEqual([]);
  });
});

describe('getListedTechniqueIds', () => {
  it('returns the techniques of the selected tactics, without duplicates', () => {
    expect(
      getListedTechniqueIds(
        tacticsObject,
        { Persistence: true, 'Privilege Escalation': true },
        catalog,
      ),
    ).toEqual(['T1098', 'T1053', 'T1134']);
  });

  it('skips the techniques missing from the catalog', () => {
    expect(
      getListedTechniqueIds(
        { Persistence: { external_id: 'TA0003', techniques: ['t-missing'] } },
        { Persistence: true },
        catalog,
      ),
    ).toEqual([]);
  });
});

describe('buildOtherAggregation', () => {
  it('matches the selected tactics and none of the listed techniques', () => {
    const agg = buildOtherAggregation(['TA0003'], ['T1098', 'T1053']);
    expect(agg[OTHER_AGGREGATION_KEY].filter).toEqual({
      bool: {
        filter: [{ terms: { [TACTIC_FIELD]: ['TA0003'] } }],
        must_not: [{ terms: { [TECHNIQUE_FIELD]: ['T1098', 'T1053'] } }],
      },
    });
    expect(
      agg[OTHER_AGGREGATION_KEY].aggs[OTHER_TECHNIQUES_BUCKETS_KEY].terms.field,
    ).toBe(TECHNIQUE_FIELD);
  });

  it('matches every finding of the tactics when no technique is listed', () => {
    const agg = buildOtherAggregation(['TA0003'], []);
    expect(agg[OTHER_AGGREGATION_KEY].filter.bool.must_not).toEqual([]);
  });
});

describe('buildOtherFilter', () => {
  it('builds a labeled DSL filter that can be negated', () => {
    const filter = buildOtherFilter('pattern-id', ['TA0003'], ['T1098'], true);
    expect(filter.meta).toMatchObject({
      alias: OTHER_FILTER_LABEL,
      negate: true,
      index: 'pattern-id',
      type: 'custom',
    });
    expect(filter.query.bool.filter[0].terms[TACTIC_FIELD]).toEqual(['TA0003']);
    expect(filter.query.bool.must_not[0].terms[TECHNIQUE_FIELD]).toEqual([
      'T1098',
    ]);
  });
});
