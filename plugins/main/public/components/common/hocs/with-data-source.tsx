import React, { useCallback } from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { withGuard } from './withGuard';
import { compose } from 'redux';
import { get } from 'lodash';
import {
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../data-source';
import { useAsyncActionRunOnStart } from '../hooks';

export const PromptErrorInitializatingDataSource = (props: {
  error?: string;
}) => {
  return (
    <EuiEmptyPrompt
      iconType='alert'
      title={<h2>Data source was not initialized</h2>}
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

export const withDataSourceInitiated = ({
  dataSourceNameProp = 'dataSource.dataSource',
  isLoadingNameProp = 'dataSource.isLoading',
  dataSourceErrorNameProp = 'dataSource.error',
}) =>
  withGuard(
    props => {
      return !get(props, isLoadingNameProp) && !get(props, dataSourceNameProp);
    },
    props => (
      <PromptErrorInitializatingDataSource
        error={get(props, dataSourceErrorNameProp)}
      ></PromptErrorInitializatingDataSource>
    ),
  );

export const withDataSource =
  ({ DataSource, DataSourceRepositoryCreator, nameProp = 'dataSource' }) =>
  WrappedCompoment =>
  props => {
    const dataSource = useDataSource<tParsedIndexPattern, PatternDataSource>({
      DataSource: DataSource,
      repository: new DataSourceRepositoryCreator(),
    });
    return <WrappedCompoment {...props} {...{ [nameProp]: dataSource }} />;
  };

export const withDataSourceFetchOnStart =
  ({
    nameProp,
    mapRequestParams,
    mapResponse,
    LoadingComponent = null,
    ErrorComponent = null,
  }) =>
  WrappedComponent =>
  props => {
    const dataSource = props[nameProp];
    const fetch = useCallback(async () => {
      const response = await dataSource.fetchData(
        mapRequestParams ? mapRequestParams({ ...props, dataSource }) : {},
      );
      return mapResponse
        ? mapResponse(response, { ...props, dataSource })
        : response;
    }, [dataSource.isLoading]);
    const action = useAsyncActionRunOnStart(fetch, [dataSource.isLoading]);

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
  DataSourceRepositoryCreator,
  nameProp = 'dataSource',
  mapRequestParams,
  mapResponse,
  LoadingDataSourceComponent,
  FetchingDataComponent,
  ErrorFetchDataComponent,
}: {
  DataSource: any;
  DataSourceRepositoryCreator: any;
  nameProp?: string;
  mapRequestParams?: () => any;
  mapResponse?: () => any;
  LoadingDataSourceComponent: any;
  FetchingDataComponent: any;
  ErrorFetchDataComponent: any;
}) =>
  compose(
    withDataSource({
      DataSource,
      DataSourceRepositoryCreator,
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
    }),
  );
