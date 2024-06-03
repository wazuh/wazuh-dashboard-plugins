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
import { PinnedAgentManager } from '../../../wz-agent-selector/wz-agent-selector-service';

type tUseDataSourceProps<T extends object, K extends PatternDataSource> = {
  DataSource: IDataSourceFactoryConstructor<K>;
  repository: tDataSourceRepository<T>;
  factory?: PatternDataSourceFactory;
  filterManager?: tFilterManager;
  filters?: tFilter[];
  fetchFilters?: tFilter[];
};

type tUseDataSourceLoadedReturns<K> = {
  isLoading: boolean;
  dataSource: K;
  filters: tFilter[];
  fetchFilters: tFilter[];
  fetchData: (params: Omit<tSearchParams, 'filters'>) => Promise<any>;
  setFilters: (filters: tFilter[]) => void;
  filterManager: PatternDataSourceFilterManager;
};

type tUseDataSourceNotLoadedReturns = {
  isLoading: boolean;
  dataSource: undefined;
  filters: [];
  fetchFilters: [];
  fetchData: (params: Omit<tSearchParams, 'filters'>) => Promise<any>;
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
  const [allFilters, setAllFilters] = useState<tFilter[]>([]);
  const pinnedAgentManager = new PinnedAgentManager();
  const pinnedAgent = pinnedAgentManager.getPinnedAgent();

  const setFilters = (filters: tFilter[]) => {
    if (!dataSourceFilterManager) {
      return;
    }
    dataSourceFilterManager?.setFilters(filters);
    setAllFilters(dataSourceFilterManager?.getFilters() || []);
    setFetchFilters(dataSourceFilterManager?.getFetchFilters() || []);
  };

  const fetchData = async (params: Omit<tSearchParams, 'filters'>) => {
    if (!dataSourceFilterManager) {
      return;
    }
    return await dataSourceFilterManager?.fetch(params);
  };

  useEffect(() => {
    let isMounted = true;
    let subscription;
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
      if (isMounted) {
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
            // this is necessary to remove the hidden filters from the filter manager and not show them in the search bar
            if (isMounted) {
              dataSourceFilterManager.setFilters(
                dataSourceFilterManager.getFilters(),
              );
              setAllFilters(dataSourceFilterManager.getFilters());
              setFetchFilters(dataSourceFilterManager.getFetchFilters());
            }
          },
        });
        setAllFilters(dataSourceFilterManager.getFilters());
        setFetchFilters(dataSourceFilterManager.getFetchFilters());
        setDataSourceFilterManager(dataSourceFilterManager);
        setIsLoading(false);
      }
    })();

    return () => subscription && subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (dataSourceFilterManager && dataSource) {
      const pinnedAgentFilter = dataSourceFilterManager
        .getFilters()
        .filter(
          (filter: tFilter) =>
            filter.meta.controlledBy ===
            PinnedAgentManager.FILTER_CONTROLLED_PINNED_AGENT_KEY,
        );

      if (pinnedAgentFilter.length) {
        dataSourceFilterManager.removeFilterByControlledBy(
          PinnedAgentManager.FILTER_CONTROLLED_PINNED_AGENT_KEY,
        );
      }
      if (pinnedAgentManager.isPinnedAgent()) {
        const pinnedAgent = PatternDataSourceFilterManager.getPinnedAgentFilter(
          dataSource.id,
        );

        dataSourceFilterManager.addFilters([...pinnedAgent]);
      }
    }
  }, [JSON.stringify(pinnedAgent)]);

  if (isLoading) {
    return {
      isLoading: true,
      dataSource: undefined,
      filters: [],
      fetchFilters: [],
      fetchData,
      setFilters,
      filterManager: null,
    };
  } else {
    return {
      isLoading: false,
      dataSource: dataSource as K,
      filters: allFilters,
      fetchFilters,
      fetchData,
      setFilters,
      filterManager: dataSourceFilterManager as PatternDataSourceFilterManager,
    };
  }
}
