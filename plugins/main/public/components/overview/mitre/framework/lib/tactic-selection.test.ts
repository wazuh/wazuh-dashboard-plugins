import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
  tFilter,
} from '../../../../common/data-source';
import { MITRE_TACTIC_NAME_FIELD } from '../../../../../../common/constants';
import {
  getTacticNamesFromFilters,
  resolveSelectedTactics,
} from './tactic-selection';

const INDEX_PATTERN_ID = 'index-pattern-id';
const CATALOG = { Impact: {}, 'Defense Evasion': {}, Discovery: {} };

const createTacticFilter = (
  value: string | string[],
  options?: { negate?: boolean; disabled?: boolean },
): tFilter => {
  const operator = Array.isArray(value)
    ? FILTER_OPERATOR.IS_ONE_OF
    : options?.negate
    ? FILTER_OPERATOR.IS_NOT
    : FILTER_OPERATOR.IS;
  const filter = PatternDataSourceFilterManager.createFilter(
    operator,
    MITRE_TACTIC_NAME_FIELD,
    value,
    INDEX_PATTERN_ID,
  ) as tFilter;
  if (options?.disabled) {
    filter.meta.disabled = true;
  }
  return filter;
};

/**
 * The platform normalises a phrase filter round-tripped through the `_a` app
 * state into `params: { query: value }`, which `createFilter` does not produce.
 */
const restoredTacticFilter = (params: unknown): tFilter =>
  ({
    meta: {
      key: MITRE_TACTIC_NAME_FIELD,
      disabled: false,
      negate: false,
      type: 'phrase',
      index: INDEX_PATTERN_ID,
      params,
    },
  } as unknown as tFilter);

describe('getTacticNamesFromFilters', () => {
  it('reads a filter created in session, whose params is the plain value', () => {
    expect(getTacticNamesFromFilters([createTacticFilter('Impact')])).toEqual([
      'Impact',
    ]);
  });

  it('reads a filter restored from app state, whose params is an object', () => {
    expect(
      getTacticNamesFromFilters([restoredTacticFilter({ query: 'Impact' })]),
    ).toEqual(['Impact']);
  });

  it('reads every value of an "is one of" filter, in either shape', () => {
    expect(
      getTacticNamesFromFilters([createTacticFilter(['Impact', 'Discovery'])]),
    ).toEqual(['Impact', 'Discovery']);
    expect(
      getTacticNamesFromFilters([
        restoredTacticFilter(['Impact', { query: 'Discovery' }]),
      ]),
    ).toEqual(['Impact', 'Discovery']);
  });

  it('skips negated and disabled filters', () => {
    expect(
      getTacticNamesFromFilters([
        createTacticFilter('Impact', { negate: true }),
        createTacticFilter('Discovery', { disabled: true }),
      ]),
    ).toEqual([]);
  });

  it('ignores filters on any other field, the tactic id included', () => {
    expect(
      getTacticNamesFromFilters([
        PatternDataSourceFilterManager.createFilter(
          FILTER_OPERATOR.IS,
          'wazuh.rule.mitre.tactic.id',
          'TA0040',
          INDEX_PATTERN_ID,
        ) as tFilter,
      ]),
    ).toEqual([]);
  });

  it('returns no name when there are no filters or no usable value', () => {
    expect(getTacticNamesFromFilters()).toEqual([]);
    expect(getTacticNamesFromFilters([])).toEqual([]);
    expect(
      getTacticNamesFromFilters([restoredTacticFilter({ type: 'phrase' })]),
    ).toEqual([]);
  });
});

describe('resolveSelectedTactics', () => {
  const resolve = (
    incomingTacticNames: string[],
    previousSignature: string | null = null,
    previousSelectedTactics: Record<string, boolean> = {},
  ) =>
    resolveSelectedTactics({
      previousSelectedTactics,
      tacticsObject: CATALOG,
      incomingTacticNames,
      previousSignature,
    });

  it('selects only the incoming tactic, keyed on its name', () => {
    const { selectedTactics, signature } = resolve(['Impact']);
    expect(signature).toBe('Impact');
    expect(selectedTactics).toEqual({
      Impact: true,
      'Defense Evasion': false,
      Discovery: false,
    });
  });

  it('selects every tactic when no name comes in', () => {
    const { selectedTactics, signature } = resolve([]);
    expect(signature).toBe('');
    expect(selectedTactics).toEqual({
      Impact: true,
      'Defense Evasion': true,
      Discovery: true,
    });
  });

  it('selects every tactic when the incoming name is absent from the catalog', () => {
    // The findings data may name a tactic differently from the MITRE catalog.
    expect(resolve(['Stealth']).selectedTactics).toEqual({
      Impact: true,
      'Defense Evasion': true,
      Discovery: true,
    });
  });

  it('re-derives when the previous selection is empty, signature unchanged', () => {
    // Guards a stale-closure overwrite: a later async resolution sees the
    // signature already advanced while its captured selection is still empty.
    expect(resolve(['Impact'], 'Impact').selectedTactics).toEqual({
      Impact: true,
      'Defense Evasion': false,
      Discovery: false,
    });
  });

  it('preserves manual facet clicks when the signature is unchanged', () => {
    const manual = { Impact: false, 'Defense Evasion': true, Discovery: false };
    expect(resolve(['Impact'], 'Impact', manual).selectedTactics).toBe(manual);
  });

  it('re-derives to every tactic once the filter is removed', () => {
    const previous = {
      Impact: true,
      'Defense Evasion': false,
      Discovery: false,
    };
    expect(resolve([], 'Impact', previous).selectedTactics).toEqual({
      Impact: true,
      'Defense Evasion': true,
      Discovery: true,
    });
  });

  it('is order-insensitive, so a reordered filter set is not re-derived', () => {
    expect(resolve(['Impact', 'Discovery']).signature).toBe(
      resolve(['Discovery', 'Impact']).signature,
    );
  });

  it('returns an empty selection while the tactics catalog is still empty', () => {
    expect(
      resolveSelectedTactics({
        previousSelectedTactics: {},
        tacticsObject: {},
        incomingTacticNames: ['Impact'],
        previousSignature: null,
      }).selectedTactics,
    ).toEqual({});
  });
});
