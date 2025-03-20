import { useEffect, useState } from 'react';
import {
  SearchBarProps,
  TimeRange,
  Query,
  Filter,
  IndexPattern,
  IndexPatternsContract,
} from '../../../../../../../../src/plugins/data/public';
import { getPlugins, getWazuhCore } from '../../../../../plugin-services';
import { useQueryManager } from './hooks/use-query';
import { useTimeFilter } from './hooks/use-time-filter';

// Input - types
interface TUseSearchBarCustomInputs {
  indexPattern: IndexPattern;
  setTimeFilter?: (timeRange: TimeRange) => void;
  setQuery?: (query: Query) => void;
  onFiltersUpdated?: (filters: Filter[]) => void;
  onQuerySubmitted?: (
    payload: { dateRange: TimeRange; query?: Query },
    isUpdate?: boolean,
  ) => void;
}
export type TUseSearchBarProps = Partial<SearchBarProps> &
  TUseSearchBarCustomInputs;

// Output types
interface TUserSearchBarResponse {
  searchBarProps: Partial<SearchBarProps>;
}

/**
 * Hook used to compose the searchbar configuration props
 * @param props
 * @returns
 */
const useSearchBarConfiguration = (
  props: TUseSearchBarProps,
): TUserSearchBarResponse => {
  const { indexPattern, filters: defaultFilters } = props;
  const { transformDateRange } = getWazuhCore().utils;
  // dependencies
  const {
    timeFilter: globalTimeFilter,
    timeHistory,
    setTimeFilter: setGlobalTimeFilter,
  } = useTimeFilter();
  const filters = defaultFilters ?? [];
  const [timeFilter, setTimeFilter] = useState(globalTimeFilter);
  const [query, setQuery] = props?.setQuery
    ? useState(props?.query || { query: '', language: 'kuery' })
    : useQueryManager();
  // This absoluteDateRange is used to ensure that the date range is the same when we make the
  // pagination request with relative dates like "Last 24 hours"
  const [absoluteDateRange, setAbsoluteDateRange] = useState<TimeRange>();

  transformDateRange(globalTimeFilter);

  // states
  const [isLoading, setIsLoading] = useState(true);
  const [indexPatternSelected, setIndexPatternSelected] =
    useState<IndexPattern>(indexPattern);

  useEffect(() => {
    if (indexPattern) {
      setIndexPatternSelected(indexPattern);
    }
  }, [indexPattern]);

  /**
   * Return the index pattern data by ID.
   * If not receive a ID return the default index from the index pattern service
   * @returns
   */
  const getDefaultIndexPattern = async (): Promise<IndexPattern> => {
    const indexPatternService = getPlugins().data
      .indexPatterns as IndexPatternsContract;

    return await indexPatternService.getDefault();
  };

  /**
   * Initialize the searchbar props with the corresponding index pattern and filters
   */
  const initSearchBar = async () => {
    setIsLoading(true);

    if (indexPattern) {
      setIndexPatternSelected(indexPattern);
    } else {
      const defaultIndexPattern = await getDefaultIndexPattern();

      setIndexPatternSelected(defaultIndexPattern);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    initSearchBar();
  }, []);

  /**
   * Search bar properties necessary to render and initialize the osd search bar component
   */
  const searchBarProps: Partial<
    SearchBarProps & {
      useDefaultBehaviors: boolean;
      absoluteDateRange: TimeRange;
    }
  > = {
    isLoading,
    ...(indexPatternSelected && { indexPatterns: [indexPatternSelected] }), // indexPattern cannot be empty or empty []
    filters,
    query,
    timeHistory,
    absoluteDateRange,
    dateRangeFrom: timeFilter.from,
    dateRangeTo: timeFilter.to,
    onQuerySubmit: (
      payload: { dateRange: TimeRange; query?: Query },
      _isUpdate?: boolean,
    ): void => {
      const { dateRange, query } = payload;

      // its necessary execute setter to apply query filters
      // when the hook receives the dateRange use the setter instead the global setTimeFilter
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      props?.setTimeFilter
        ? props?.setTimeFilter(dateRange)
        : setGlobalTimeFilter(dateRange);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      props?.setQuery ? props?.setQuery(query) : setQuery(query);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      props?.onQuerySubmitted && props?.onQuerySubmitted(payload);
      setTimeFilter(dateRange);
      setAbsoluteDateRange(transformDateRange(dateRange));
      setQuery(query);
    },
    // its necessary to use saved queries. if not, the load saved query not work
    useDefaultBehaviors: true,
  };

  return {
    searchBarProps,
  };
};

export default useSearchBarConfiguration;
