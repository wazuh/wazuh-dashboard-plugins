import React from 'react';
import { inventoryTableDefaultColumns } from './config';
import { withErrorBoundary } from '../../../common/hocs';
import { compose } from 'redux';
import { withFIMFilesDataSource } from '../common/hocs/validate-fim-states-index-pattern';
import { ModuleEnabledCheck } from '../common/components/check-module-enabled';
import {
  FILTER_OPERATOR,
  FIMFilesStatesDataSource,
  FIMFilesStatesDataSourceRepository,
  PatternDataSource,
  PatternDataSourceFilterManager,
} from '../../../common/data-source';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import { WazuhFlyoutDiscoverNewFilterManager } from '../../../common/wazuh-discover/wz-flyout-discover';
import { AppState, formatUIDate } from '../../../../react-services';
import { getCore } from '../../../../kibana-services';
import { EuiLink } from '@elastic/eui';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER } from '../../../../../common/constants';
import { rules } from '../../../../utils/applications';
import TechniqueRowDetails from '../../mitre/framework/components/techniques/components/flyout-technique/technique-row-details';
import { setFilters } from '../../../common/search-bar/set-filters';
import { buildPhraseFilter } from '../../../../../../../src/plugins/data/common';

function getDiscoverColumns({ agent }) {
  const agentId = agent?.id;
  return agentId
    ? [
        {
          id: 'timestamp',
          isSortable: true,
          defaultSortDirection: 'desc',
          displayAsText: 'Time',
          render: value => formatUIDate(value),
        },
        {
          id: 'syscheck.event',
          displayAsText: 'Action',
        },
        { id: 'rule.description', displayAsText: 'Description' },
        { id: 'rule.level', displayAsText: 'Level' },
        {
          id: 'rule.id',
          displayAsText: 'Rule ID',
          render: value => (
            <RedirectAppLinks application={getCore().application}>
              <EuiLink
                href={getCore().application.getUrlForApp(rules.id, {
                  path: `#/manager/?tab=rules&redirectRule=${value}`,
                })}
              >
                {value}
              </EuiLink>
            </RedirectAppLinks>
          ),
        },
      ]
    : [
        {
          id: 'timestamp',
          isSortable: true,
          defaultSortDirection: 'desc',
          displayAsText: 'Time',
          render: value => formatUIDate(value),
        },
        {
          id: 'agent.id',
          displayAsText: 'Agent',
          render: value => (
            <RedirectAppLinks application={getCore().application}>
              <EuiLink
                href={getCore().application.getUrlForApp(endpointSummary.id, {
                  path: `#/agents/?tab=welcome&agent=${value}`,
                })}
              >
                {value}
              </EuiLink>
            </RedirectAppLinks>
          ),
        },
        {
          id: 'agent.name',
          displayAsText: 'Agent name',
        },
        {
          id: 'syscheck.event',
          displayAsText: 'Action',
        },
        { id: 'rule.description', displayAsText: 'Description' },
        { id: 'rule.level', displayAsText: 'Level' },
        {
          id: 'rule.id',
          displayAsText: 'Rule ID',
          render: value => (
            <RedirectAppLinks application={getCore().application}>
              <EuiLink
                href={getCore().application.getUrlForApp(rules.id, {
                  path: `#/manager/?tab=rules&redirectRule=${value}`,
                })}
              >
                {value}
              </EuiLink>
            </RedirectAppLinks>
          ),
        },
      ];
}

function getImplicitFilters({ file }: { file: string }) {
  return [
    ...PatternDataSourceFilterManager.getClusterManagerFilters(
      AppState.getCurrentPattern(),
      DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
    ),
    PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS,
      'rule.groups',
      'syscheck',
      AppState.getCurrentPattern(),
    ),
    PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS,
      'syscheck.path',
      file,
      AppState.getCurrentPattern(),
    ),
  ];
}

function renderDiscoverExpandedRow(props: {
  doc: any;
  item: any;
  indexPattern: any;
  filterManager: any;
}) {
  const { filterManager } = props;
  return (
    <TechniqueRowDetails
      {...props}
      onRuleItemClick={(value: any, indexPattern: IndexPattern) => {
        // add filters to the filter state
        // generate the filter
        const key = Object.keys(value)[0];
        const filterValue = value[key];
        const valuesArray = Array.isArray(filterValue)
          ? [...filterValue]
          : [filterValue];
        const newFilter = valuesArray
          .map(item =>
            buildPhraseFilter(
              { name: key, type: 'string' },
              item,
              indexPattern,
            ),
          )
          .filter(Boolean);

        filterManager.addFilters(newFilter);
      }}
      filters={[]}
      setFilters={setFilters(filterManager)}
    />
  );
}

export const InventoryFIMFiles = compose(
  withErrorBoundary,
  withFIMFilesDataSource,
)(({ agent }) => {
  return (
    <WzTableDiscover
      DataSource={FIMFilesStatesDataSource}
      DataSourceRepositoryCreator={FIMFilesStatesDataSourceRepository}
      tableDefaultColumns={inventoryTableDefaultColumns}
      displayOnlyNoResultsCalloutOnNoResults={true}
      additionalDocumentDetailsTabs={({ document }) => {
        return [
          {
            id: 'events',
            name: 'Events',
            content: (
              <WazuhFlyoutDiscoverNewFilterManager
                DataSource={PatternDataSource}
                tableColumns={getDiscoverColumns({ agent: agent })}
                initialFetchFilters={getImplicitFilters({
                  file: document._source.file.path,
                })}
                expandedRowComponent={(...args) =>
                  renderDiscoverExpandedRow(...args)
                }
              />
            ),
          },
        ];
      }}
    />
  );
});
