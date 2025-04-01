import React from 'react';
import {
  EuiPageTemplate,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
} from '@elastic/eui';
import { useDataSourceWithSearchBar } from '../../../common/hooks/use-data-source-search-context';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { IntlProvider } from 'react-intl';
import {
  FILTER_OPERATOR,
  PatternDataSource,
  PatternDataSourceFilterManager,
  FIMStatesDataSource,
  FIMStatesDataSourceRepository,
} from '../../../common/data-source';
import { WzSearchBar } from '../../../common/search-bar';
import { WzTableUseParentDataSource } from './table';
import filesColumns from './table-columns/files';
import registriesColumns from './table-columns/registries';
import { withDataSourceInitiated } from '../../../common/hocs';
import { withFIMDataSource } from '../common/hocs/validate-fim-states-index-pattern';
import { WazuhFlyoutDiscoverNewFilterManagerRecentEvents } from '../../../common/wazuh-data-grid/recent-events/recent-events';
import { fileIntegrityMonitoring } from '../../../../utils/applications';
import * as filesUtils from './inventory-files';
import * as registriesUtils from './inventory-files';

const InventoryFIMDashboard = withDataSourceInitiated(
  ({
    dataSource,
    fetchFilters,
    fixedFilters,
    filters,
    setFilters,
    searchBarProps,
    fetchData,
    fingerprint,
    isDataSourceLoading,
    agent,
  }) => (
    <>
      <WzSearchBar
        appName='wzTable'
        {...searchBarProps}
        filters={filters}
        fixedFilters={fixedFilters}
        showDatePicker={false}
        showQueryInput={true}
        showQueryBar={true}
        showSaveQuery={true}
      />
      <EuiPanel
        paddingSize='m'
        hasShadow={false}
        hasBorder={false}
        color='transparent'
      >
        <EuiFlexGroup gutterSize='s'>
          <EuiFlexItem>
            <WzTableUseParentDataSource
              dataSource={dataSource}
              fetchFilters={[
                ...fetchFilters,
                PatternDataSourceFilterManager.createFilter(
                  FILTER_OPERATOR.EXISTS,
                  'file.path',
                  null,
                  dataSource.title,
                ),
              ]}
              fixedFilters={fixedFilters}
              filters={filters}
              setFilters={setFilters}
              searchBarProps={searchBarProps}
              fetchData={fetchData}
              fingerprint={fingerprint}
              isDataSourceLoading={isDataSourceLoading}
              tableDefaultColumns={filesColumns}
              title='Files'
              additionalDocumentDetailsTabs={({ document, indexPattern }) => {
                console.log({ document, indexPattern });
                return [
                  {
                    id: 'events',
                    name: 'Events',
                    content: (
                      <WazuhFlyoutDiscoverNewFilterManagerRecentEvents
                        document={document}
                        agent={agent}
                        applicationId={fileIntegrityMonitoring.id}
                        applicationTab='fim'
                        recentEventsSpecificFilters={
                          filesUtils.getRecentEventsSpecificFilters
                        }
                        DataSource={PatternDataSource}
                        tableColumns={filesUtils.getDiscoverColumns({ agent })}
                        initialFetchFilters={filesUtils.getImplicitFilters({
                          file: document._source.file.path,
                        })}
                        expandedRowComponent={(...args) =>
                          filesUtils.renderDiscoverExpandedRow(...args)
                        }
                      />
                    ),
                  },
                ];
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup gutterSize='s'>
          <EuiFlexItem>
            <WzTableUseParentDataSource
              dataSource={dataSource}
              fetchFilters={[
                ...fetchFilters,
                PatternDataSourceFilterManager.createFilter(
                  FILTER_OPERATOR.EXISTS,
                  'registry.path',
                  null,
                  dataSource.title,
                ),
              ]}
              fixedFilters={fixedFilters}
              filters={filters}
              setFilters={setFilters}
              searchBarProps={searchBarProps}
              fetchData={fetchData}
              fingerprint={fingerprint}
              isDataSourceLoading={isDataSourceLoading}
              tableDefaultColumns={registriesColumns}
              title='Registries'
              additionalDocumentDetailsTabs={({ document }) => {
                return [
                  {
                    id: 'events',
                    name: 'Events',
                    content: (
                      <WazuhFlyoutDiscoverNewFilterManagerRecentEvents
                        document={document}
                        agent={agent}
                        applicationId={fileIntegrityMonitoring.id}
                        applicationTab='fim'
                        recentEventsSpecificFilters={
                          registriesUtils.getRecentEventsSpecificFilters
                        }
                        DataSource={PatternDataSource}
                        tableColumns={registriesUtils.getDiscoverColumns({
                          agent,
                        })}
                        initialFetchFilters={registriesUtils.getImplicitFilters(
                          {
                            file: document._source.registry.path,
                          },
                        )}
                        expandedRowComponent={(...args) =>
                          registriesUtils.renderDiscoverExpandedRow(...args)
                        }
                      />
                    ),
                  },
                ];
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </>
  ),
);

export const InventoryFIM = withFIMDataSource(({ agent }) => {
  const {
    dataSource,
    filters,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
    searchBarProps,
    fingerprint,
    error,
  } = useDataSourceWithSearchBar({
    DataSource: FIMStatesDataSource,
    DataSourceRepositoryCreator: FIMStatesDataSourceRepository,
  });

  return (
    <IntlProvider locale='en'>
      <>
        <EuiPageTemplate
          className='wz-table-discover-container'
          restrictWidth='100%'
          fullHeight={true}
          grow
          paddingSize='none'
          pageContentProps={{ color: 'transparent' }}
        >
          <>
            {isDataSourceLoading ? (
              <LoadingSearchbarProgress />
            ) : (
              <InventoryFIMDashboard
                error={error}
                dataSource={dataSource}
                fetchFilters={fetchFilters}
                fixedFilters={fixedFilters}
                filters={filters}
                setFilters={setFilters}
                searchBarProps={searchBarProps}
                fetchData={fetchData}
                fingerprint={fingerprint}
                isDataSourceLoading={isDataSourceLoading}
                agent={agent}
              />
            )}
          </>
        </EuiPageTemplate>
      </>
    </IntlProvider>
  );
});
