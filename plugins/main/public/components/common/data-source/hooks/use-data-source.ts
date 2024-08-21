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
import { createOsdUrlStateStorage } from '../../../../../../../src/plugins/opensearch_dashboards_utils/public';
import NavigationService from '../../../../react-services/navigation-service';
import { OSD_URL_STATE_STORAGE_ID } from '../../../../../common/constants';
import { getUiSettings } from '../../../../kibana-services';
import { PinnedAgentManager } from '../../../wz-agent-selector/wz-agent-selector-service';
import { useIsMounted } from '../../hooks/use-is-mounted';

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
  setFilters: (filters: tFilter[]) => void;
  filterManager: PatternDataSourceFilterManager;
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
  setFilters: (filters: tFilter[]) => void;
  filterManager: null;
};

export function useDataSource<
  T extends tParsedIndexPattern,
  K extends PatternDataSource,
>(
  props: tUseDataSourceProps<T, K>,
): tUseDataSourceLoadedReturns<K> | tUseDataSourceNotLoadedReturns {
  const navigationService = NavigationService.getInstance();
  const config = getUiSettings();
  const history = navigationService.getHistory();
  const osdUrlStateStorage = createOsdUrlStateStorage({
    useHash: config.get(OSD_URL_STATE_STORAGE_ID),
    history: history,
  });
  const appDefaultFilters = osdUrlStateStorage.get('_a')?.filters ?? [];
  const globalDefaultFilters = osdUrlStateStorage.get('_g')?.filters ?? [];
  const defaultFilters = [...appDefaultFilters, ...globalDefaultFilters];
  const {
    filters: initialFilters = [...defaultFilters],
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
      setFilters,
      filterManager: dataSourceFilterManager as PatternDataSourceFilterManager,
    };
  }
}
