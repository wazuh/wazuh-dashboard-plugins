import React, { useState } from 'react';
import { getDashboard } from '../visualization';
import { ViewMode } from '../../../../../../src/plugins/embeddable/public';
import { FilterManager } from '../../../../../../src/plugins/data/public/';
import { getCore } from '../../../plugin-services';
import {
  EuiButton,
  EuiContextMenu,
  EuiPopover,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlexGroup,
  EuiTitle,
} from '@elastic/eui';
import { Layout } from '../components';
import specification from '../spec.json';
import { transformAssetSpecToListTableColumn } from '../utils/transform-asset-spec';

const specColumns = transformAssetSpecToListTableColumn(specification);

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
    DocumentViewTableAndJson,
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

  const [indexPattern, setIndexPattern] = React.useState(null);
  const [inspectedHit, setInspectedHit] = React.useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const defaultColumns = [
    ...specColumns,
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
          onClick: ({ _document }) => {
            setInspectedHit(_document);
          },
          'data-test-subj': 'action-view',
        },
        {
          name: 'Edit',
          isPrimary: true,
          description: 'Edit',
          icon: 'pencil',
          type: 'icon',
          onClick: (...rest) => {
            console.log({ rest });
          },
          'data-test-subj': 'action-edit',
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

  return (
    <Layout title={title} actions={actions}>
      <TableIndexer
        DataSource={RulesDataSource}
        DataSourceRepository={RulesDataSourceRepository}
        tableProps={{
          title: 'Catalog',
          tableColumns: defaultColumns,
          actionButtons: props => TableActions({ ...props, selectedItems }),
          tableSortingInitialField: defaultColumns[0].field,
          tableSortingInitialDirection: 'asc',
          tableProps: {
            itemId: 'name',
            selection: {
              onSelectionChange: item => {
                setSelectedItems(item);
              },
            },
            isSelectable: true,
          },
        }}
        exportCSVPrefixFilename='rules'
        onSetIndexPattern={setIndexPattern}
      />
      {inspectedHit && (
        <EuiFlyout onClose={() => setInspectedHit(null)} size='m'>
          <EuiFlyoutHeader>
            <EuiTitle>
              <h2>Details: {inspectedHit._source.name}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiFlexGroup direction='column'>
              <DocumentViewTableAndJson
                document={inspectedHit}
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
                              inspectedHit._source.name,
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
                                inspectedHit._source.name.match(
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
      )}
    </Layout>
  );
};

const TableActions = ({ selectedItems }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EuiPopover
      panelPaddingSize='none'
      button={
        <EuiButton
          iconType='arrowDown'
          iconSide='right'
          onClick={() => setIsOpen(state => !state)}
        >
          Actions
        </EuiButton>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
    >
      <EuiContextMenu
        initialPanelId={0}
        // The EuiContextMenu has bug when testing in jest
        // the props change won't make it rerender
        key={''}
        panels={[
          {
            id: 0,
            items: [
              {
                name: 'Export',
                disabled: selectedItems.length === 0,
                'data-test-subj': 'editAction',
                onClick: () => {
                  /* TODO: implement */
                },
              },
              { isSeparator: true },
              {
                name: 'Delete',
                disabled: selectedItems.length === 0,
                'data-test-subj': 'deleteAction',
                onClick: () => {
                  /* TODO: implement */
                },
              },
            ],
          },
        ]}
      />
    </EuiPopover>
  );
};
