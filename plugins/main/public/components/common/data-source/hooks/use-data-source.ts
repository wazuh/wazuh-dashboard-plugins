import React, { useEffect, useState } from 'react';
import {
  IDataSourceFactoryConstructor,
  tDataSource,
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

type tUseDataSourceProps<T extends object, K extends PatternDataSource> = {
  DataSource: IDataSourceFactoryConstructor<K>;
  repository: tDataSourceRepository<T>;
  factory?: PatternDataSourceFactory;
  filterManager?: tFilterManager;
  filters?: tFilter[];
};

type tUseDataSourceLoadedReturns<K> = {
  isLoading: boolean;
  dataSource: K;
  filters: tFilter[];
  fetchFilters: tFilter[];
  fixedFilters: tFilter[];
  fetchData: (params: Omit<tSearchParams, 'filters'>) => Promise<any>;
  setFilters: (filters: tFilter[]) => void;
  filterManager: PatternDataSourceFilterManager;
};

type tUseDataSourceNotLoadedReturns = {
  isLoading: boolean;
  dataSource: undefined;
  filters: [];
  fetchFilters: [];
  fixedFilters: [];
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
    filters: defaultFilters = [],
    DataSource: DataSourceConstructor,
    repository,
    factory: injectedFactory,
  } = props;

  if (!repository || !DataSourceConstructor) {
    throw new Error('DataSource and repository are required');
  }

  const [dataSource, setDataSource] = useState<tDataSource>();
  const [dataSourceFilterManager, setDataSourceFilterManager] =
    useState<PatternDataSourceFilterManager | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchFilters, setFetchFilters] = useState<tFilter[]>([]);
  const [allFilters, setAllFilters] = useState<tFilter[]>([]);

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
      setDataSource(dataSource);
      const dataSourceFilterManager = new PatternDataSourceFilterManager(
        dataSource,
        defaultFilters,
      );
      if (!dataSourceFilterManager) {
        throw new Error('Error creating filter manager');
      }

      // what the filters update
      subscription = dataSourceFilterManager.getUpdates$().subscribe({
        next: () => {
          // this is necessary to remove the hidden filters from the filter manager and not show them in the search bar
          dataSourceFilterManager.setFilters(
            dataSourceFilterManager.getFilters(),
          );
          setAllFilters(dataSourceFilterManager.getFilters());
          setFetchFilters(dataSourceFilterManager.getFetchFilters());
        },
      });
      setAllFilters(dataSourceFilterManager.getFilters());
      setFetchFilters(dataSourceFilterManager.getFetchFilters());
      setDataSourceFilterManager(dataSourceFilterManager);
      setIsLoading(false);
    })();
    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return {
      isLoading: true,
      dataSource: undefined,
      filters: [],
      fetchFilters: [],
      fixedFilters: [],
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
      fixedFilters: dataSourceFilterManager?.getFixedFilters() || [],
      fetchData,
      setFilters,
      filterManager: dataSourceFilterManager as PatternDataSourceFilterManager,
    };
  }
}
