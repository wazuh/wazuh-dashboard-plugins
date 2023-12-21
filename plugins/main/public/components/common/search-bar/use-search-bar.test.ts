import { renderHook } from '@testing-library/react-hooks';
import '@testing-library/jest-dom/extend-expect';
// osd dependencies
import { Start, dataPluginMock } from '../../../../../../src/plugins/data/public/mocks';
import {
  Filter,
  IndexPattern,
  Query,
  TimeRange,
} from '../../../../../../src/plugins/data/public';
// wazuh plugin dependencies
import useSearchBar from './use-search-bar';
import { getDataPlugin } from '../../../kibana-services';
import * as timeFilterHook from '../hooks/use-time-filter';
import * as queryManagerHook from '../hooks/use-query';

/**
 * Mocking Data Plugin
 **/
jest.mock('../../../kibana-services', () => {
  return {
    getDataPlugin: jest.fn(),
  };
});
/* using osd mock utils */
const mockDataPlugin = dataPluginMock.createStartContract();
const mockedGetDataPlugin = getDataPlugin as jest.Mock<Start>;
mockedGetDataPlugin.mockImplementation(
  () =>
    ({
      ...mockDataPlugin,
      ...{
        query: {
          ...mockDataPlugin.query,
          queryString: {
            ...mockDataPlugin.query.queryString,
            getUpdates$: jest.fn(() => ({
              subscribe: jest.fn(),
              unsubscribe: jest.fn(),
            })),
          },
        },
      },
    } as Start)
);
///////////////////////////////////////////////////////////

const mockedDefaultIndexPatternData: Partial<IndexPattern> = {
  // used partial not avoid fill all the interface, it's only for testing purpose
  id: 'default-index-pattern',
  title: '',
};

describe('[hook] useSearchBarConfiguration', () => {
  beforeAll(() => {
    /***** mock use-time-filter hook *****/
    const spyUseTimeFilter = jest.spyOn(timeFilterHook, 'useTimeFilter');
    const mockTimeFilterResult: TimeRange = {
      from: 'now/d',
      to: 'now/d',
    };
    spyUseTimeFilter.mockImplementation(() => ({
      timeFilter: mockTimeFilterResult,
      setTimeFilter: jest.fn(),
      timeHistory: [],
    }));
    /***** mock use-time-filter hook *****/
    const spyUseQueryManager = jest.spyOn(queryManagerHook, 'useQueryManager');
    const mockQueryResult: Query = {
      language: 'kuery',
      query: '',
    };
    spyUseQueryManager.mockImplementation(() => [mockQueryResult, jest.fn()]);
  });

  it.only('should return default app index pattern when not receiving a default index pattern', async () => {
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'getDefault')
      .mockResolvedValue(mockedDefaultIndexPatternData);
    jest.spyOn(mockDataPlugin.query.filterManager, 'getFilters').mockReturnValue([]);
    const { result, waitForNextUpdate } = renderHook(() => useSearchBar({}));
    await waitForNextUpdate();
    expect(mockDataPlugin.indexPatterns.getDefault).toBeCalled();
    expect(result.current.searchBarProps.indexPatterns).toMatchObject([
      mockedDefaultIndexPatternData,
    ]);
  });

  it('should return the same index pattern when receiving a default index pattern', async () => {
    const exampleIndexPatternId = 'wazuh-index-pattern';
    const mockedIndexPatternData: Partial<IndexPattern> = {
      // used partial not avoid fill all the interface, it's only for testing purpose
      id: exampleIndexPatternId,
      title: '',
    };
    jest.spyOn(mockDataPlugin.indexPatterns, 'get').mockResolvedValue(mockedIndexPatternData);
    const { result, waitForNextUpdate } = renderHook(() =>
      useSearchBar({
        defaultIndexPatternID: 'wazuh-index-pattern',
      })
    );
    await waitForNextUpdate();
    expect(mockDataPlugin.indexPatterns.get).toBeCalledWith(exampleIndexPatternId);
    expect(result.current.searchBarProps.indexPatterns).toMatchObject([mockedIndexPatternData]);
  });

  it('should show an ERROR message and get the default app index pattern when not found the index pattern data by the ID received', async () => {
    const INDEX_NOT_FOUND_ERROR = new Error('Index Pattern not found');
    jest.spyOn(mockDataPlugin.indexPatterns, 'get').mockImplementation(() => {
      throw INDEX_NOT_FOUND_ERROR;
    });
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'getDefault')
      .mockResolvedValue(mockedDefaultIndexPatternData);
    jest.spyOn(mockDataPlugin.query.filterManager, 'getFilters').mockReturnValue([]);

    // mocking console error to avoid logs in test and check if is called
    const mockedConsoleError = jest.spyOn(console, 'error').mockImplementationOnce(() => {});
    const { result, waitForNextUpdate } = renderHook(() =>
      useSearchBar({
        defaultIndexPatternID: 'invalid-index-pattern-id',
      })
    );

    await waitForNextUpdate();
    expect(mockDataPlugin.indexPatterns.getDefault).toBeCalled();
    expect(mockDataPlugin.indexPatterns.get).toBeCalledWith('invalid-index-pattern-id');
    expect(result.current.searchBarProps.indexPatterns).toMatchObject([
      mockedDefaultIndexPatternData,
    ]);
    expect(mockedConsoleError).toBeCalledWith(INDEX_NOT_FOUND_ERROR);
  });

  it('should return the same filters and apply them to the filter manager when are received by props', async () => {
    const defaultFilters: Filter[] = [
      {
        query: 'something to filter',
        meta: {
          alias: 'filter-mocked',
          disabled: false,
          negate: true,
        },
      },
    ];
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'getDefault')
      .mockResolvedValue(mockedDefaultIndexPatternData);
    jest.spyOn(mockDataPlugin.query.filterManager, 'getFilters').mockReturnValue(defaultFilters);
    const { result, waitForNextUpdate } = renderHook(() =>
      useSearchBar({
        filters: defaultFilters,
      })
    );

    await waitForNextUpdate();

    expect(result.current.searchBarProps.filters).toMatchObject(defaultFilters);
    expect(mockDataPlugin.query.filterManager.setFilters).toBeCalledWith(defaultFilters);
    expect(mockDataPlugin.query.filterManager.getFilters).toBeCalled();
  });

  it('should return and preserve filters when the index pattern received is equal to the index pattern already selected in the app', async () => {
    const defaultIndexFilters: Filter[] = [
      {
        query: 'something to filter',
        meta: {
          alias: 'filter-mocked',
          disabled: false,
          negate: true,
        },
      },
    ];
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'getDefault')
      .mockResolvedValue(mockedDefaultIndexPatternData);
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'get')
      .mockResolvedValue(mockedDefaultIndexPatternData);
    jest
      .spyOn(mockDataPlugin.query.filterManager, 'getFilters')
      .mockReturnValue(defaultIndexFilters);
    const { result, waitForNextUpdate } = renderHook(() =>
      useSearchBar({
        defaultIndexPatternID: mockedDefaultIndexPatternData.id,
      })
    );
    await waitForNextUpdate();
    expect(result.current.searchBarProps.indexPatterns).toMatchObject([
      mockedDefaultIndexPatternData,
    ]);
    expect(result.current.searchBarProps.filters).toMatchObject(defaultIndexFilters);
  });

  it('should return empty filters when the index pattern is NOT equal to the default app index pattern', async () => {
    const exampleIndexPatternId = 'wazuh-index-pattern';
    const mockedExampleIndexPatternData: Partial<IndexPattern> = {
      // used partial not avoid fill all the interface, it's only for testing purpose
      id: exampleIndexPatternId,
      title: '',
    };
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'get')
      .mockResolvedValue(mockedExampleIndexPatternData);
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'getDefault')
      .mockResolvedValue(mockedDefaultIndexPatternData);
    jest.spyOn(mockDataPlugin.query.filterManager, 'getFilters').mockReturnValue([]);
    const { result, waitForNextUpdate } = renderHook(() =>
      useSearchBar({
        defaultIndexPatternID: exampleIndexPatternId,
      })
    );
    await waitForNextUpdate();
    expect(result.current.searchBarProps.indexPatterns).toMatchObject([
      mockedExampleIndexPatternData,
    ]);
    expect(result.current.searchBarProps.filters).toStrictEqual([]);
  });
});
