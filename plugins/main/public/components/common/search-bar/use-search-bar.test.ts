import { renderHook } from '@testing-library/react-hooks';
import '@testing-library/jest-dom/extend-expect';
// osd dependencies
import {
  Start,
  dataPluginMock,
} from '../../../../../../src/plugins/data/public/mocks';
import {
  IndexPattern,
  Query,
  TimeRange,
} from '../../../../../../src/plugins/data/public';
// wazuh plugin dependencies
import useSearchBar from './use-search-bar';
import { getDataPlugin } from '../../../kibana-services';
import * as timeFilterHook from '../hooks/use-time-filter';
import * as queryManagerHook from '../hooks/use-query';
import { AppState } from '../../../react-services/app-state';

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
    } as Start),
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

  it('should return default app index pattern when not receiving a default index pattern', async () => {
    jest
      .spyOn(AppState, 'getCurrentPattern')
      .mockImplementation(() => 'default-index-pattern');
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'getDefault')
      .mockResolvedValue(mockedDefaultIndexPatternData);
    jest
      .spyOn(mockDataPlugin.query.filterManager, 'getFilters')
      .mockReturnValue([]);
    // @ts-ignore
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
    jest
      .spyOn(AppState, 'getCurrentPattern')
      .mockImplementation(() => 'wazuh-alerts-*');
    jest.spyOn(AppState, 'setCurrentPattern').mockImplementation(jest.fn());
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'get')
      .mockResolvedValue(mockedIndexPatternData);
    const { result, waitForNextUpdate } = renderHook(() =>
      useSearchBar({
        indexPattern: mockedIndexPatternData as IndexPattern,
        setFilters: jest.fn(),
      }),
    );
    expect(result.current.searchBarProps.indexPatterns).toMatchObject([
      mockedIndexPatternData,
    ]);
  });

  it('should return empty filters when NOT equal a default filters', async () => {
    const exampleIndexPatternId = 'wazuh-index-pattern';
    const mockedExampleIndexPatternData: Partial<IndexPattern> = {
      // used partial not avoid fill all the interface, it's only for testing purpose
      id: exampleIndexPatternId,
      title: '',
    };
    jest
      .spyOn(AppState, 'getCurrentPattern')
      .mockImplementation(() => exampleIndexPatternId);
    jest.spyOn(AppState, 'setCurrentPattern').mockImplementation(jest.fn());
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'get')
      .mockResolvedValue(mockedExampleIndexPatternData);
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'getDefault')
      .mockResolvedValue(mockedDefaultIndexPatternData);
    jest
      .spyOn(mockDataPlugin.query.filterManager, 'getFilters')
      .mockReturnValue([]);
    const { result, waitForNextUpdate } = renderHook(() =>
      useSearchBar({
        indexPattern: mockedExampleIndexPatternData as IndexPattern,
        setFilters: jest.fn()
      }),
    );
    expect(result.current.searchBarProps.indexPatterns).toMatchObject([
      mockedExampleIndexPatternData,
    ]);
    expect(result.current.searchBarProps.filters).toStrictEqual([]);
  });

  it('should reload the index pattern when the index pattern changes', async () => {
    const exampleIndexPatternId = 'wazuh-index-pattern';
    const mockedExampleIndexPatternData: Partial<IndexPattern> = {
      // used partial not avoid fill all the interface, it's only for testing purpose
      id: exampleIndexPatternId,
      title: '',
    };
    jest
      .spyOn(AppState, 'getCurrentPattern')
      .mockImplementation(() => exampleIndexPatternId);
    jest.spyOn(AppState, 'setCurrentPattern').mockImplementation(jest.fn());
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'get')
      .mockResolvedValue(mockedExampleIndexPatternData);
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'getDefault')
      .mockResolvedValue(mockedDefaultIndexPatternData);
    jest
      .spyOn(mockDataPlugin.query.filterManager, 'getFilters')
      .mockReturnValue([]);
    const { result, waitForNextUpdate, rerender } = renderHook(
      // @ts-ignore
      (props) => useSearchBar(props),
      {
        initialProps: {
          indexPattern: mockedExampleIndexPatternData as IndexPattern,
          setFilters: jest.fn()
        },
      },
    );
    expect(result.current.searchBarProps.indexPatterns).toMatchObject([
      mockedExampleIndexPatternData,
    ]);
    const newExampleIndexPatternData: Partial<IndexPattern> = {
      // used partial not avoid fill all the interface, it's only for testing purpose
      id: 'new-wazuh-index-pattern',
      title: '',
    };
    jest
      .spyOn(mockDataPlugin.indexPatterns, 'get')
      .mockResolvedValue(newExampleIndexPatternData);
    rerender({
      indexPattern: newExampleIndexPatternData as IndexPattern,
      setFilters: jest.fn()
    });
    expect(result.current.searchBarProps.indexPatterns).toMatchObject([
      newExampleIndexPatternData,
    ]);
  })
});
