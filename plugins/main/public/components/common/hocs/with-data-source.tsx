import React, { useCallback } from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { withGuard } from './withGuard';
import { compose } from 'redux';
import { get } from 'lodash';
import {
  PatternDataSource,
  tParsedIndexPattern,
  tSearchParams,
  useDataSource,
} from '../data-source';
import { useAsyncActionRunOnStart } from '../hooks';
import { useDataSourceWithSearchBar } from '../hooks/use-data-source-search-context';

export const PromptErrorInitializatingDataSource = (props: {
  error?: string;
}) => {
  return (
    <EuiEmptyPrompt
      iconType='alert'
      title={<h2>Data source has an error</h2>}
      body={<>{typeof props.error === 'string' && <p>{props.error}</p>}</>}
    />
  );
};

export const HideOnErrorInitializatingDataSource = ({
  error,
  children,
}: {
  error: string | null | undefined;
  children: React.ReactNode;
}) => <div {...(error ? { className: 'wz-no-display' } : {})}>{children}</div>;

export const withDataSourceLoading = ({
  isLoadingNameProp = 'isDataSourceLoading',
  LoadingComponent = () => null,
}) => withGuard(props => get(props, isLoadingNameProp), LoadingComponent);

/**
 * This has to be used in combination with withDataSourceLoading else the guard condition could cause
 * the wrapped component is rendered
 * @param param0
 * @returns
 */
export const withDataSourceInitiated = ({
  dataSourceNameProp = 'dataSource.dataSource',
  isLoadingNameProp = 'dataSource.isLoading',
  dataSourceErrorNameProp = 'dataSource.error',
}) =>
  withGuard(
    props => {
      return (
        /* data source is not defined or there is an error related to the data source initialization */
        (!get(props, isLoadingNameProp) && !get(props, dataSourceNameProp)) ||
        get(props, dataSourceErrorNameProp)
      );
    },
    props => (
      <PromptErrorInitializatingDataSource
        error={get(props, dataSourceErrorNameProp)}
      ></PromptErrorInitializatingDataSource>
    ),
  );

/**
 * This HOC creates the dataSource instance. It allows to pass the DataSource and
 * DataSourceRepositoryCreator as builders or as props.
 * @param param0
 * @returns
 */
export const withDataSource =
  ({
    DataSource,
    DataSourceRepositoryCreator,
    nameProp = 'dataSource',
    DataSourceFromNameProp,
    DataSourceRepositoryCreatorFromNameProp,
  }) =>
  WrappedCompoment =>
  props => {
    const DataSourceBuilder = DataSourceFromNameProp
      ? get(props, DataSourceFromNameProp)
      : DataSource;
    const DataSourceRepositoryCreatorBuilder =
      DataSourceRepositoryCreatorFromNameProp
        ? get(props, DataSourceRepositoryCreatorFromNameProp)
        : DataSourceRepositoryCreator;
    const dataSource = useDataSource<tParsedIndexPattern, PatternDataSource>({
      DataSource: DataSourceBuilder,
      repository: new DataSourceRepositoryCreatorBuilder(),
    });
    return (
      <WrappedCompoment {...props} {...{ [nameProp]: { ...dataSource } }} />
    );
  };

/**
 * This HOC creates the dataSource instance and the search bar props. It allows to pass the
 * DataSource and DataSourceRepositoryCreator as builders or as props.
 * @param param0
 * @returns
 */
export const withDataSourceSearchBar =
  ({
    DataSource,
    DataSourceRepositoryCreator,
    nameProp = 'dataSource',
    DataSourceFromNameProp,
    DataSourceRepositoryCreatorFromNameProp,
  }) =>
  WrappedCompoment =>
  props => {
    const DataSourceBuilder = DataSourceFromNameProp
      ? get(props, DataSourceFromNameProp)
      : DataSource;
    const DataSourceRepositoryCreatorBuilder =
      DataSourceRepositoryCreatorFromNameProp
        ? get(props, DataSourceRepositoryCreatorFromNameProp)
        : DataSourceRepositoryCreator;

    const dataSource = useDataSourceWithSearchBar({
      DataSource: DataSourceBuilder,
      DataSourceRepositoryCreator: DataSourceRepositoryCreatorBuilder,
    });
    return <WrappedCompoment {...props} {...{ [nameProp]: dataSource }} />;
  };

interface WithDataSourceFetchOnStartProps {
  nameProp: string;
  mapRequestParams?: (props: {
    dataSource: any;
    [key: string]: any;
  }) => tSearchParams;
  mapResponse?: (response: any, props: any) => any;
  LoadingComponent?: React.ComponentType<{ action: any }>;
  ErrorComponent?: React.ComponentType<{
    action: any;
    error: any;
    refresh: () => void;
  }>;
  mapFetchActionDependencies?: (props: {
    dataSource: any;
    [key: string]: any;
  }) => any[] | any[];
  fetchOptions?: {
    refreshDataOnPreRun?: boolean;
  };
}

export const withDataSourceFetchOnStart =
  ({
    nameProp,
    mapRequestParams,
    mapResponse,
    LoadingComponent = null,
    ErrorComponent = null,
    mapFetchActionDependencies = [],
    fetchOptions = {},
  }: WithDataSourceFetchOnStartProps) =>
  WrappedComponent =>
  props => {
    const dataSource = get(props, nameProp);
    const fetch = useCallback(
      async (...dependencies: any[]) => {
        const response = await dataSource.fetchData(
          mapRequestParams
            ? mapRequestParams({ ...props, dataSource, dependencies })
            : {},
        );
        return mapResponse
          ? mapResponse(response, { ...props, dataSource, dependencies })
          : response;
      },
      [dataSource.fetchFilters],
    );

    const actionActionRunDependencies =
      typeof mapFetchActionDependencies === 'function'
        ? mapFetchActionDependencies({ ...props, dataSource })
        : mapFetchActionDependencies || [];

    const action = useAsyncActionRunOnStart(
      fetch,
      [dataSource.isLoading, ...actionActionRunDependencies],
      fetchOptions,
    );

    if (LoadingComponent && action.running) {
      return <LoadingComponent action={action} />;
    }

    if (ErrorComponent && action.error) {
      return (
        <ErrorComponent
          action={action}
          error={action.error}
          refresh={action.run}
        />
      );
    }

    return (
      <WrappedComponent {...props} {...{ [nameProp + 'Action']: action }} />
    );
  };

export const withDataSourceFetch = ({
  DataSource,
  DataSourceFromNameProp,
  DataSourceRepositoryCreator,
  DataSourceRepositoryCreatorFromNameProp,
  nameProp = 'dataSource',
  mapRequestParams,
  mapResponse,
  mapFetchActionDependencies,
  LoadingDataSourceComponent,
  FetchingDataComponent,
  ErrorFetchDataComponent,
}: {
  DataSource: any;
  DataSourceFromNameProp?: string;
  DataSourceRepositoryCreator: any;
  DataSourceRepositoryCreatorFromNameProp?: string;
  nameProp?: string;
  mapRequestParams?: WithDataSourceFetchOnStartProps['mapRequestParams'];
  mapResponse?: WithDataSourceFetchOnStartProps['mapResponse'];
  mapFetchActionDependencies?: WithDataSourceFetchOnStartProps['mapFetchActionDependencies'];
  LoadingDataSourceComponent?: any;
  FetchingDataComponent?: any;
  ErrorFetchDataComponent?: any;
}) =>
  compose(
    withDataSource({
      DataSource,
      DataSourceFromNameProp,
      DataSourceRepositoryCreator,
      DataSourceRepositoryCreatorFromNameProp,
      nameProp,
    }),
    withDataSourceLoading({
      isLoadingNameProp: `${nameProp}.isLoading`,
      LoadingComponent: LoadingDataSourceComponent,
    }),
    withDataSourceInitiated({
      dataSourceNameProp: `${nameProp}.dataSource`,
      isLoadingNameProp: `${nameProp}.isLoading`,
      dataSourceErrorNameProp: `${nameProp}.error`,
    }),
    withDataSourceFetchOnStart({
      nameProp,
      mapRequestParams,
      mapResponse,
      LoadingComponent: FetchingDataComponent,
      ErrorComponent: ErrorFetchDataComponent,
      mapFetchActionDependencies: mapFetchActionDependencies,
    }),
  );

export const withDataSourceFetchSearchBar = ({
  DataSource,
  DataSourceFromNameProp,
  DataSourceRepositoryCreator,
  DataSourceRepositoryCreatorFromNameProp,
  nameProp = 'dataSource',
  mapRequestParams,
  mapResponse,
  mapFetchActionDependencies,
  fetchOptions = {
    refreshDataOnPreRun: false,
  },
  LoadingDataSourceComponent,
  FetchingDataComponent,
  ErrorFetchDataComponent,
}: {
  DataSource: any;
  DataSourceFromNameProp?: string;
  DataSourceRepositoryCreator: any;
  DataSourceRepositoryCreatorFromNameProp?: string;
  nameProp?: string;
  mapRequestParams?: WithDataSourceFetchOnStartProps['mapRequestParams'];
  mapResponse?: WithDataSourceFetchOnStartProps['mapResponse'];
  mapFetchActionDependencies?: WithDataSourceFetchOnStartProps['mapFetchActionDependencies'];
  LoadingDataSourceComponent?: any;
  FetchingDataComponent?: any;
  ErrorFetchDataComponent?: any;
  fetchOptions: WithDataSourceFetchOnStartProps['fetchOptions'];
}) =>
  compose(
    withDataSourceSearchBar({
      DataSource,
      DataSourceFromNameProp,
      DataSourceRepositoryCreator,
      DataSourceRepositoryCreatorFromNameProp,
      nameProp,
    }),
    withDataSourceLoading({
      isLoadingNameProp: `${nameProp}.isLoading`,
      LoadingComponent: LoadingDataSourceComponent,
    }),
    withDataSourceInitiated({
      dataSourceNameProp: `${nameProp}.dataSource`,
      isLoadingNameProp: `${nameProp}.isLoading`,
      dataSourceErrorNameProp: `${nameProp}.error`,
    }),
    withDataSourceFetchOnStart({
      nameProp,
      mapRequestParams,
      mapResponse,
      LoadingComponent: FetchingDataComponent,
      ErrorComponent: ErrorFetchDataComponent,
      mapFetchActionDependencies: mapFetchActionDependencies,
      fetchOptions,
    }),
  );
