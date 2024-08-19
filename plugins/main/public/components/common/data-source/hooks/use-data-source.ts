import { useEffect, useState } from 'react';
import {
  IDataSourceFactoryConstructor,
  tDataSourceRepository,
  tFilter,
  tSearchParams,
  PatternDataSourceSelector,
  PatternDataSourceFactory,
  PatternDataSource,
  tParsedIndexPattern,
  PatternDataSourceFilterManager,
  tFilterManager,
} from '../index';
import { TimeRange } from '../../../../../../../src/plugins/data/public';
import { PinnedAgentManager } from '../../../wz-agent-selector/wz-agent-selector-service';
import { useIsMounted } from '../../hooks/use-is-mounted';
import { transformDateRange } from '../../search-bar/search-bar-service';

type tUseDataSourceProps<T extends object, K extends PatternDataSource> = {
  DataSource: IDataSourceFactoryConstructor<K>;
  repository: tDataSourceRepository<T>;
  factory?: PatternDataSourceFactory;
  filterManager?: tFilterManager;
  /*
    Filters applied by the user that will be shown in the search bar
  */
  filters?: tFilter[];
  /*
    Filters that will be used to make the fetch request, is a merge of the user filters, fixed filters and fetch (hidden) filters
  */
  fetchFilters?: tFilter[];
  /*
    Filters applied by the data source and cannot be removed by the user
  */
  fixedFilters?: tFilter[];
};

type tUseDataSourceLoadedReturns<K> = {
  isLoading: boolean;
  dataSource: K;
  /*
    Filters applied by the user that will be shown in the search bar
  */
  filters: tFilter[];
  /*
    Filters that will be used to make the fetch request, is a merge of the user filters, fixed filters and fetch (hidden) filters
  */
  fetchFilters: tFilter[];
  /*
    Filters applied by the data source and cannot be removed by the user
  */
  fixedFilters: tFilter[];
  fetchData: (params: Omit<tSearchParams, 'filters'>) => Promise<any>;
  fetchPageData: (
    params: Omit<tSearchParams, 'filters' | 'dateRange'>,
  ) => Promise<any>;
  setFilters: (filters: tFilter[]) => void;
  filterManager: PatternDataSourceFilterManager;
  fetchDateRange: TimeRange;
};

type tUseDataSourceNotLoadedReturns = {
  isLoading: boolean;
  dataSource: undefined;
  /*
    Filters applied by the user that will be shown in the search bar
  */
  filters: [];
  /*
    Filters that will be used to make the fetch request, is a merge of the user filters, fixed filters and fetch (hidden) filters
  */
  fetchFilters: [];
  /*
    Filters applied by the data source and cannot be removed by the user
  */
  fixedFilters: [];
  fetchData: (params: Omit<tSearchParams, 'filters'>) => Promise<any>;
  fetchPageData: (
    params: Omit<tSearchParams, 'filters' | 'dateRange'>,
  ) => Promise<any>;
  setFilters: (filters: tFilter[]) => void;
  filterManager: null;
};

export function useDataSource<
  T extends tParsedIndexPattern,
  K extends PatternDataSource,
>(
  props: tUseDataSourceProps<T, K>,
): tUseDataSourceLoadedReturns<K> | tUseDataSourceNotLoadedReturns {
  const {
    filters: initialFilters = [],
    fetchFilters: initialFetchFilters = [],
    fixedFilters: initialFixedFilters = [],
    DataSource: DataSourceConstructor,
    repository,
    factory: injectedFactory,
    filterManager: injectedFilterManager,
  } = props;

  if (!repository || !DataSourceConstructor) {
    throw new Error('DataSource and repository are required');
  }

  const [dataSource, setDataSource] = useState<PatternDataSource>();
  const [dataSourceFilterManager, setDataSourceFilterManager] =
    useState<PatternDataSourceFilterManager | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchFilters, setFetchFilters] = useState<tFilter[]>([]);
  const [fixedFilters, setFixedFilters] = useState<tFilter[]>([]);
  const [allFilters, setAllFilters] = useState<tFilter[]>([]);
  const pinnedAgentManager = new PinnedAgentManager();
  const pinnedAgent = pinnedAgentManager.getPinnedAgent();
  const [fetchDateRange, setFetchDateRange] = useState<TimeRange>();
  const { isComponentMounted, getAbortController } = useIsMounted();

  const setFilters = (filters: tFilter[]) => {
    if (!dataSourceFilterManager) {
      return;
    }
    dataSourceFilterManager?.setFilters(filters);
    setAllFilters(dataSourceFilterManager?.getFilters() || []);
    setFetchFilters(dataSourceFilterManager?.getFetchFilters() || []);
    setFixedFilters(dataSourceFilterManager?.getFixedFilters() || []);
  };

  const fetchData = async (params: Omit<tSearchParams, 'filters'>) => {
    if (!dataSourceFilterManager) {
      return;
    }
    const paramsWithSignal = { ...params, signal: getAbortController().signal };
    setFetchDateRange(transformDateRange(params.dateRange));
    return await dataSourceFilterManager?.fetch(paramsWithSignal);
  };

  const fetchPageData = async (
    params: Omit<tSearchParams, 'filters' | 'dateRange'>,
  ) => {
    if (!dataSourceFilterManager) {
      return;
    }
    const paramsWithSignal = {
      ...params,
      dateRange: fetchDateRange,
      signal: getAbortController().signal,
    };
    return await dataSourceFilterManager?.fetch(paramsWithSignal);
  };

  useEffect(() => {
    let subscription: any;

    (async () => {
      setIsLoading(true);
      const factory = injectedFactory || new PatternDataSourceFactory();
      const patternsData = await repository.getAll();
      const dataSources = await factory.createAll(
        DataSourceConstructor,
        patternsData,
      );
      const selector = new PatternDataSourceSelector(dataSources, repository);
      const dataSource = await selector.getSelectedDataSource();
      if (!dataSource) {
        throw new Error('No valid data source found');
      }
      if (!isComponentMounted()) return;
      setDataSource(dataSource);
      const dataSourceFilterManager = new PatternDataSourceFilterManager(
        dataSource,
        initialFilters,
        injectedFilterManager,
        initialFetchFilters,
      );
      // what the filters update
      subscription = dataSourceFilterManager.getUpdates$().subscribe({
        next: () => {
          if (!isComponentMounted()) return;
          // this is necessary to remove the hidden filters from the filter manager and not show them in the search bar
          dataSourceFilterManager.setFilters(
            dataSourceFilterManager.getFilters(),
          );
          setAllFilters(dataSourceFilterManager.getFilters());
          setFetchFilters(dataSourceFilterManager.getFetchFilters());
          setFixedFilters(dataSourceFilterManager.getFixedFilters());
        },
      });
      setAllFilters(dataSourceFilterManager.getFilters());
      setFetchFilters(dataSourceFilterManager.getFetchFilters());
      setFixedFilters(dataSourceFilterManager.getFixedFilters());
      setDataSourceFilterManager(dataSourceFilterManager);
      setIsLoading(false);
    })();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (dataSourceFilterManager && dataSource) {
      setFixedFilters(dataSourceFilterManager.getFixedFilters());
      setFetchFilters(dataSourceFilterManager.getFetchFilters());
    }
  }, [JSON.stringify(pinnedAgent)]);

  if (isLoading) {
    return {
      isLoading: true,
      dataSource: undefined,
      filters: [],
      fetchFilters: [],
      fixedFilters: [],
      fetchData,
      fetchPageData,
      setFilters,
      filterManager: null,
    };
  } else {
    return {
      isLoading: false,
      dataSource: dataSource as K,
      filters: allFilters,
      fetchFilters,
      fixedFilters,
      fetchData,
      fetchPageData,
      setFilters,
      filterManager: dataSourceFilterManager as PatternDataSourceFilterManager,
      fetchDateRange,
    };
  }
}
