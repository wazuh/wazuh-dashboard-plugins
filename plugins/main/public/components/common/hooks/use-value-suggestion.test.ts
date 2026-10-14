import { act, renderHook, waitFor } from '@testing-library/react';
import { getDataPlugin } from '../../../kibana-services';
import { useValueSuggestion } from './use-value-suggestion';
import { IIndexPattern } from 'src/plugins/data/public';

jest.mock('../../../kibana-services', () => ({
  getDataPlugin: jest.fn(),
}));

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

const indexPattern = {
  fields: [{ spec: { name: 'check.name', type: 'string' } }],
} as unknown as IIndexPattern;

const createSearchSource = (keys: string[]) => {
  const fields: Record<string, any> = {};
  const searchSource = {
    setParent: jest.fn(() => searchSource),
    setField: jest.fn((name: string, value: any) => {
      fields[name] = value;
      return searchSource;
    }),
    fetch: jest.fn(() =>
      Promise.resolve({
        aggregations: { suggestions: { buckets: keys.map(key => ({ key })) } },
      }),
    ),
  };
  return { searchSource, fields };
};

const mockDataPlugin = ({
  searchSources = [],
  getValueSuggestions = jest.fn(() => Promise.resolve([])),
}: {
  searchSources?: ReturnType<typeof createSearchSource>['searchSource'][];
  getValueSuggestions?: jest.Mock;
}) => {
  const create = jest.fn();
  searchSources.forEach(searchSource =>
    create.mockResolvedValueOnce(searchSource),
  );
  (getDataPlugin as jest.Mock).mockReturnValue({
    autocomplete: { getValueSuggestions },
    search: { searchSource: { create } },
  });
  return { create, getValueSuggestions };
};

const noBoolFilter = { field: '', value: '' };
const containsOptions = {
  matchMode: 'contains' as const,
  matchFields: ['check.name', 'check.id'],
};

describe('useValueSuggestion', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('uses the prefix autocomplete by default', async () => {
    const { getValueSuggestions, create } = mockDataPlugin({
      getValueSuggestions: jest.fn(() =>
        Promise.resolve(['Ensure permissions']),
      ),
    });

    const { result } = renderHook(() =>
      useValueSuggestion('check.name', noBoolFilter, undefined, indexPattern),
    );

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['Ensure permissions']),
    );
    expect(getValueSuggestions).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('matches the query anywhere in the match fields, ignoring case', async () => {
    jest.useFakeTimers();
    const initial = createSearchSource([]);
    const filtered = createSearchSource(['Ensure permissions on /etc/crontab']);
    mockDataPlugin({
      searchSources: [initial.searchSource, filtered.searchSource],
    });

    const { result } = renderHook(() =>
      useValueSuggestion(
        'check.name',
        noBoolFilter,
        undefined,
        indexPattern,
        containsOptions,
      ),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setQuery('Perm*'));
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual([
        'Ensure permissions on /etc/crontab',
      ]),
    );
    expect(filtered.fields.query.query.bool.should).toEqual([
      {
        wildcard: {
          'check.name': { value: '*Perm\\**', case_insensitive: true },
        },
      },
      {
        wildcard: {
          'check.id': { value: '*Perm\\**', case_insensitive: true },
        },
      },
    ]);
    expect(filtered.fields.aggs.suggestions.terms).toEqual({
      field: 'check.name',
      size: 10,
    });
  });

  it('suggests the field values without a query when the search is empty', async () => {
    const { searchSource, fields } = createSearchSource(['Ensure AIDE']);
    mockDataPlugin({ searchSources: [searchSource] });

    const { result } = renderHook(() =>
      useValueSuggestion(
        'check.name',
        noBoolFilter,
        undefined,
        indexPattern,
        containsOptions,
      ),
    );

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['Ensure AIDE']),
    );
    expect(fields.query.query.bool).toEqual({ filter: [] });
  });

  it('only searches the last query typed within the debounce delay', async () => {
    jest.useFakeTimers();
    const initial = createSearchSource([]);
    const last = createSearchSource(['Ensure permissions']);
    const { create } = mockDataPlugin({
      searchSources: [initial.searchSource, last.searchSource],
    });

    const { result } = renderHook(() =>
      useValueSuggestion(
        'check.name',
        noBoolFilter,
        undefined,
        indexPattern,
        containsOptions,
      ),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setQuery('p'));
    act(() => result.current.setQuery('pe'));
    act(() => result.current.setQuery('per'));
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['Ensure permissions']),
    );
    expect(create).toHaveBeenCalledTimes(2);
    expect(
      last.fields.query.query.bool.should[0].wildcard['check.name'].value,
    ).toBe('*per*');
  });

  it('ignores a response that arrives after a newer query', async () => {
    let resolveFirst: (value: string[]) => void = () => {};
    const getValueSuggestions = jest
      .fn()
      .mockImplementationOnce(
        () => new Promise<string[]>(resolve => (resolveFirst = resolve)),
      )
      .mockResolvedValueOnce(['Ensure permissions']);
    mockDataPlugin({ getValueSuggestions });

    const { result } = renderHook(() =>
      useValueSuggestion('check.name', noBoolFilter, undefined, indexPattern),
    );
    act(() => result.current.setQuery('Ensure'));
    await waitFor(() =>
      expect(result.current.suggestedValues).toEqual(['Ensure permissions']),
    );

    await act(() => {
      resolveFirst(['Stale value']);
      return Promise.resolve();
    });

    expect(result.current.suggestedValues).toEqual(['Ensure permissions']);
  });
});
