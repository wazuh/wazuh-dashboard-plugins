import React from 'react';
import { getDashboard } from '../visualization';
import { ViewMode } from '../../../../../../src/plugins/embeddable/public';
import { FilterManager } from '../../../../../../src/plugins/data/public/';
import { getCore } from '../../../plugin-services';
import { EuiButton } from '@elastic/eui';
import { Layout } from '../components';

export const defaultColumns: EuiDataGridColumn[] = [
  {
    field: 'name',
    name: 'Name',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.title',
    name: 'Title',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.description',
    name: 'Description',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.author.name',
    name: 'Author name',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.author.date',
    name: 'Author date',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.author.email',
    name: 'Author email',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.author.url',
    name: 'Author URL',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.compatibility',
    name: 'Compatibility',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.integration',
    name: 'Integration',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.versions',
    name: 'Versions',
    sortable: true,
    show: true,
  },
  {
    field: 'metadata.references',
    name: 'References',
    sortable: true,
    show: true,
  },
  {
    field: 'parents',
    name: 'Parent',
    sortable: true,
  },
  {
    name: 'Actions',
    show: true,
    actions: [
      {
        name: 'View',
        isPrimary: true,
        description: 'View details',
        icon: 'eye',
        type: 'icon',
        onClick: (...rest) => {
          console.log({ rest });
        },
        'data-test-subj': 'action-view',
      },
      {
        name: 'Export',
        isPrimary: true,
        description: 'Export file',
        icon: 'exportAction',
        type: 'icon',
        onClick: (...rest) => {
          console.log({ rest });
        },
        'data-test-subj': 'action-export',
      },
      {
        name: 'Delete',
        isPrimary: true,
        description: 'Delete file',
        icon: 'trash',
        type: 'icon',
        onClick: (...rest) => {
          console.log({ rest });
        },
        'data-test-subj': 'action-delete',
      },
    ],
  },
];

export const RulesList = props => {
  const {
    TableIndexer,
    RulesDataSource,
    RulesDataSourceRepository,
    DashboardContainerByValueRenderer: DashboardByRenderer,
    WazuhFlyoutDiscover,
    PatternDataSource,
    AppState,
    DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
    PatternDataSourceFilterManager,
    FILTER_OPERATOR,
    title,
  } = props;

  const actions = [
    <EuiButton
      onClick={() => {
        // TODO: Implement
      }}
      iconType='importAction'
    >
      Import file
    </EuiButton>,
    <EuiButton
      fill
      onClick={() => {
        props.navigationService.getInstance().navigate('/engine/rules/new');
      }}
    >
      Create Rule
    </EuiButton>,
  ];

  return (
    <Layout title={title} actions={actions}>
      <TableIndexer
        DataSource={RulesDataSource}
        DataSourceRepository={RulesDataSourceRepository}
        tableProps={{
          title: 'Rules',
          tableColumns: defaultColumns,
          tableSortingInitialField: 'id',
          tableSortingInitialDirection: 'asc',
          tableProps: {
            itemId: 'id',
            selection: {
              onSelectionChange: () => {},
            },
            isSelectable: true,
          },
        }}
        exportCSVPrefixFilename='rules'
        documentDetailsExtraTabs={{
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
                      params.document._source.name,
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
                      { id: 'rule.description', displayAsText: 'Description' },
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
                        params.document._source.name.match(
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
      />
    </Layout>
  );
};
