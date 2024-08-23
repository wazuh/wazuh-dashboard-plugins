import React from 'react';
import { getDashboard } from '../visualization';
import { ViewMode } from '../../../../../../src/plugins/embeddable/public';
import { FilterManager } from '../../../../../../src/plugins/data/public/';
import { getCore } from '../../../plugin-services';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlexGroup,
  EuiTitle,
} from '@elastic/eui';
import { withDataSourceFetch } from '../../../hocs/with-data-source-fetch';

export const Detail = withDataSourceFetch(
  ({
    data,
    indexPattern,
    onClose,
    DocumentViewTableAndJson,
    WazuhFlyoutDiscover,
    PatternDataSource,
    AppState,
    PatternDataSourceFilterManager,
    FILTER_OPERATOR,
    DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
    DashboardContainerByValueRenderer: DashboardByRenderer,
  }) => {
    // To be able to display a non-loaded rule, the component should fetch it before
    // to display it
    return (
      <EuiFlyout onClose={onClose} size='m'>
        <EuiFlyoutHeader>
          <EuiTitle>
            <h2>Details: {data._source.name}</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiFlexGroup direction='column'>
            <DocumentViewTableAndJson
              document={data}
              indexPattern={indexPattern}
              extraTabs={{
                post: params => [
                  {
                    id: 'relationship',
                    name: 'Relationship',
                    content: () => (
                      <DashboardByRenderer
                        input={{
                          viewMode: ViewMode.VIEW,
                          // Try to use the index pattern that the dataSource has
                          // but if it is undefined use the index pattern of the hoc
                          // because the first executions of the dataSource are undefined
                          // and embeddables need index pattern.
                          panels: getDashboard(
                            'wazuh-rules',
                            data._source.name,
                          ),
                          isFullScreenMode: false,
                          filters: [],
                          useMargins: true,
                          id: 'rule-vis',
                          title: 'rule-vis',
                          description: 'rule-vis',
                          query: '',
                          refreshConfig: {
                            pause: false,
                            value: 15,
                          },
                          hidePanelTitles: false,
                        }}
                      />
                    ),
                  },
                  {
                    id: 'events',
                    name: 'Events',
                    content: () => {
                      const filterManager = React.useMemo(
                        () => new FilterManager(getCore().uiSettings),
                        [],
                      );
                      return (
                        <WazuhFlyoutDiscover
                          DataSource={PatternDataSource}
                          tableColumns={[
                            {
                              id: 'timestamp',
                              displayAsText: 'Time',
                            },
                            {
                              id: 'agent.name',
                              displayAsText: 'Agent name',
                            },
                            {
                              id: 'rule.description',
                              displayAsText: 'Description',
                            },
                            { id: 'rule.level', displayAsText: 'Level' },
                          ]}
                          filterManager={filterManager}
                          initialFetchFilters={[
                            ...PatternDataSourceFilterManager.getClusterManagerFilters(
                              AppState.getCurrentPattern(),
                              DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
                            ),
                            PatternDataSourceFilterManager.createFilter(
                              FILTER_OPERATOR.IS,
                              'rule.id',
                              data._source.name.match(
                                /^[^/]+\/([^/]+)\/[^/]+$/,
                              )[1], // TODO: do the alerts use the name format of the rule?
                              AppState.getCurrentPattern(),
                            ),
                          ]}
                          // expandedRowComponent={(...args) =>
                          //   this.renderDiscoverExpandedRow(...args)
                          // }
                        />
                      );
                    },
                  },
                ],
              }}
              tableProps={{
                onFilter(...rest) {
                  // TODO: implement using the dataSource
                },
                onToggleColumn() {
                  // TODO: reseach if make sense the ability to toggle columns
                },
              }}
            />
          </EuiFlexGroup>
        </EuiFlyoutBody>
      </EuiFlyout>
    );
  },
);
