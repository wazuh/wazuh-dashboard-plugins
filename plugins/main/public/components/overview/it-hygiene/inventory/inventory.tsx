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
  PatternDataSourceFilterManager,
  SystemInventoryStatesDataSource,
  SystemInventoryStatesDataSourceRepository,
} from '../../../common/data-source';
import { WzSearchBar } from '../../../common/search-bar';
import { WzTableUseParentDataSource } from './table';
import packagesColumns from '../../system-inventory-packages/inventory/default-columns';
import hotfixesColumns from '../../system-inventory-hotfixes/inventory/default-columns';
import systemColumns from '../../system-inventory-system/inventory/default-columns';
import processesColumns from '../../system-inventory-processes/inventory/default-columns';
import portsColumns from '../../system-inventory-ports/inventory/default-columns';
import interfacesColumns from '../../system-inventory-interfaces/inventory/default-columns';

export const InventoryITHygiene = () => {
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
  } = useDataSourceWithSearchBar({
    DataSource: SystemInventoryStatesDataSource,
    DataSourceRepositoryCreator: SystemInventoryStatesDataSourceRepository,
  });

  const shouldDisplayNoResults = false;
  const shouldDisplayTable = false;

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
            )}
            {!isDataSourceLoading && (
              <>
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
                            'package.name',
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
                        tableDefaultColumns={packagesColumns}
                        title='Packages'
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <WzTableUseParentDataSource
                        dataSource={dataSource}
                        fetchFilters={[
                          ...fetchFilters,
                          PatternDataSourceFilterManager.createFilter(
                            FILTER_OPERATOR.EXISTS,
                            'package.hotfix.name',
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
                        tableDefaultColumns={hotfixesColumns}
                        title='Windows updates'
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
                            'host.os.name',
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
                        tableDefaultColumns={systemColumns}
                        title='System'
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
                            'process.pid', // package.name field is present in the ports data
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
                        tableDefaultColumns={processesColumns}
                        title='Processes'
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <WzTableUseParentDataSource
                        dataSource={dataSource}
                        fetchFilters={[
                          ...fetchFilters,
                          PatternDataSourceFilterManager.createFilter(
                            FILTER_OPERATOR.EXISTS,
                            'destination.port',
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
                        tableDefaultColumns={portsColumns}
                        title='Ports'
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <WzTableUseParentDataSource
                        dataSource={dataSource}
                        fetchFilters={[
                          ...fetchFilters,
                          PatternDataSourceFilterManager.createFilter(
                            FILTER_OPERATOR.EXISTS,
                            'observer.ingress.interface.name',
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
                        tableDefaultColumns={interfacesColumns}
                        title='Interfaces'
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              </>
            )}
          </>
        </EuiPageTemplate>
      </>
    </IntlProvider>
  );
};
