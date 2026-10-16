import { act, renderHook, waitFor } from '@testing-library/react';
import { getDataPlugin, getUiSettings } from '../../../kibana-services';
import { useValueSuggestion } from './use-value-suggestion';
import { IIndexPattern } from 'src/plugins/data/public';

jest.mock('../../../kibana-services', () => ({
  getDataPlugin: jest.fn(),
  getUiSettings: jest.fn(),
}));

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

const indexPattern = {
  fields: [
    { spec: { name: 'check.name', type: 'string', aggregatable: true } },
    { spec: { name: 'check.title', type: 'string', aggregatable: false } },
    { spec: { name: 'package.enabled', type: 'boolean', aggregatable: true } },
    { spec: { name: 'source.port', type: 'number', aggregatable: true } },
  ],
} as unknown as IIndexPattern;

const createSearchSource = (keys: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {};
  let resolveFetch: () => void = () => {};
  const searchSource = {
    setParent: jest.fn(() => searchSource),
    setField: jest.fn((name: string, value: unknown) => {
      fields[name] = value;
      return searchSource;
    }),
    fetch: jest.fn(() =>
      Promise.resolve({
        aggregations: { suggestions: { buckets: keys.map(key => ({ key })) } },
      }),
    ),
  };
  const holdFetch = () =>
    searchSource.fetch.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFetch = () =>
            resolve({
              aggregations: {
                suggestions: { buckets: keys.map(key => ({ key })) },
              },
            });
        }),
    );
  return { searchSource, fields, holdFetch, release: () => resolveFetch() };
};

const mockPlatform = ({
  searchSources = [],
  getValueSuggestions = jest.fn(() => Promise.resolve([true, false])),
  suggestValues = true,
}: {
  searchSources?: ReturnType<typeof createSearchSource>['searchSource'][];
  getValueSuggestions?: jest.Mock;
  suggestValues?: boolean;
}) => {
  const create = jest.fn();
  searchSources.forEach(searchSource =>
    create.mockResolvedValueOnce(searchSource),
  );
  (getDataPlugin as jest.Mock).mockReturnValue({
    autocomplete: { getValueSuggestions },
    search: { searchSource: { create } },
  });
  (getUiSettings as jest.Mock).mockReturnValue({
    get: jest.fn(() => suggestValues),
  });
  return { create, getValueSuggestions };
};

const wildcard = (field: string, value: string) => ({
  // eslint-disable-next-line camelcase
  wildcard: { [field]: { value, case_insensitive: true } },
});

const noBoolFilter = { field: '', value: '' };
const githubFilter = { field: 'rule.groups', value: 'github' };

const typeQuery = (
  result: { current: ReturnType<typeof useValueSuggestion> },
  query: string,
) => {
  act(() => result.current.setQuery(query));
  act(() => {
    jest.advanceTimersByTime(300);
  });
};

describe('useValueSuggestion', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('suggests string values that contain the query, ignoring case', async () => {
    const initial = createSearchSource([]);
    const filtered = createSearchSource(['Ensure permissions on /etc/crontab']);
    mockPlatform({
      searchSources: [initial.searchSource, filtered.searchSource],
    });

    const { result } = renderHook(() =>
      useValueSuggestion('check.name', noBoolFilter, undefined, indexPattern),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    typeQuery(result, 'Perm*?\\');

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual([
        'Ensure permissions on /etc/crontab',
      ]),
    );
    expect(filtered.fields.query.query.bool.filter).toEqual([
      wildcard('check.name', '*Perm\\*\\?\\\\*'),
    ]);
    expect(filtered.fields.aggs.suggestions.terms).toEqual({
      field: 'check.name',
      size: 10,
    });
    expect(filtered.fields.timeout).toBe('1000ms');
    expect(filtered.fields.terminate_after).toBe(100000);
  });

  it('suggests the most common values without waiting when the search is empty', async () => {
    const { searchSource, fields } = createSearchSource(['Ensure AIDE']);
    mockPlatform({ searchSources: [searchSource] });

    const { result } = renderHook(() =>
      useValueSuggestion('check.name', noBoolFilter, undefined, indexPattern),
    );

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['Ensure AIDE']),
    );
    expect(fields.query.query.bool).toEqual({ filter: [] });
  });

  it('keeps the drilldown filter when searching', async () => {
    const initial = createSearchSource([]);
    const filtered = createSearchSource(['octocat']);
    mockPlatform({
      searchSources: [initial.searchSource, filtered.searchSource],
    });

    const { result } = renderHook(() =>
      useValueSuggestion('check.name', githubFilter, undefined, indexPattern),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(initial.fields.query.query.bool.filter).toEqual([
      { term: { 'rule.groups': 'github' } },
    ]);

    typeQuery(result, 'cat');

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['octocat']),
    );
    expect(filtered.fields.query.query.bool.filter).toEqual([
      { term: { 'rule.groups': 'github' } },
      wildcard('check.name', '*cat*'),
    ]);
  });

  it.each([
    ['the field is not aggregatable', 'check.title', true],
    ['value suggestions are disabled', 'check.name', false],
  ])('suggests nothing when %s', async (_description, field, suggestValues) => {
    const { create } = mockPlatform({ suggestValues });

    const { result } = renderHook(() =>
      useValueSuggestion(field, noBoolFilter, undefined, indexPattern),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.suggestedValues).toEqual([]);
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps the platform suggestions for boolean fields', async () => {
    const { create, getValueSuggestions } = mockPlatform({});

    const { result } = renderHook(() =>
      useValueSuggestion(
        'package.enabled',
        noBoolFilter,
        undefined,
        indexPattern,
      ),
    );

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual([true, false]),
    );
    expect(getValueSuggestions).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps the script aggregation for other field types', async () => {
    const initial = createSearchSource([]);
    const filtered = createSearchSource(['443']);
    mockPlatform({
      searchSources: [initial.searchSource, filtered.searchSource],
    });

    const { result } = renderHook(() =>
      useValueSuggestion('source.port', noBoolFilter, undefined, indexPattern),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    typeQuery(result, '44');

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['443']),
    );
    expect(filtered.fields.query.query.script.script.params).toEqual({
      searchQuery: '44',
    });
  });

  it('filters the given options without a request or delay', async () => {
    const { create } = mockPlatform({});

    const { result } = renderHook(() =>
      useValueSuggestion(
        'check.name',
        noBoolFilter,
        ['Open', 'Closed'],
        indexPattern,
      ),
    );
    act(() => result.current.setQuery('OS'));

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['Closed']),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('only searches the last query typed within the debounce delay', async () => {
    const initial = createSearchSource([]);
    const last = createSearchSource(['Ensure permissions']);
    const { create } = mockPlatform({
      searchSources: [initial.searchSource, last.searchSource],
    });

    const { result } = renderHook(() =>
      useValueSuggestion('check.name', noBoolFilter, undefined, indexPattern),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setQuery('p'));
    act(() => result.current.setQuery('pe'));
    typeQuery(result, 'per');

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['Ensure permissions']),
    );
    expect(create).toHaveBeenCalledTimes(2);
    expect(last.fields.query.query.bool.filter).toEqual([
      wildcard('check.name', '*per*'),
    ]);
  });

  it('ignores a response that arrives after a newer query', async () => {
    const initial = createSearchSource([]);
    const stale = createSearchSource(['Stale value']);
    const latest = createSearchSource(['Ensure permissions']);
    stale.holdFetch();
    mockPlatform({
      searchSources: [
        initial.searchSource,
        stale.searchSource,
        latest.searchSource,
      ],
    });

    const { result } = renderHook(() =>
      useValueSuggestion('check.name', noBoolFilter, undefined, indexPattern),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    typeQuery(result, 'perm');
    await waitFor(() => expect(stale.searchSource.fetch).toHaveBeenCalled());
    typeQuery(result, 'permissions');
    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['Ensure permissions']),
    );

    await act(() => {
      stale.release();
      return Promise.resolve();
    });

    expect(result.current.suggestedValues).toEqual(['Ensure permissions']);
  });
});
