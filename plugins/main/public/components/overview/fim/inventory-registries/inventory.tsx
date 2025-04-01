import React from 'react';
import { inventoryTableDefaultColumns } from './config';
import { withErrorBoundary } from '../../../common/hocs';
import { compose } from 'redux';
import { withFIMRegistriesDataSource } from '../common/hocs/validate-fim-states-index-pattern';
import { ModuleEnabledCheck } from '../common/components/check-module-enabled';
import {
  FILTER_OPERATOR,
  FIMRegistriesStatesDataSource,
  FIMRegistriesStatesDataSourceRepository,
  PatternDataSource,
  PatternDataSourceFilterManager,
} from '../../../common/data-source';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import { AppState, formatUIDate } from '../../../../react-services';
import { getCore } from '../../../../kibana-services';
import { EuiLink } from '@elastic/eui';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER } from '../../../../../common/constants';
import { fileIntegrityMonitoring, rules } from '../../../../utils/applications';
import TechniqueRowDetails from '../../mitre/framework/components/techniques/components/flyout-technique/technique-row-details';
import { setFilters } from '../../../common/search-bar/set-filters';
import { buildPhraseFilter } from '../../../../../../../src/plugins/data/common';
import { WazuhFlyoutDiscoverNewFilterManagerRecentEvents } from '../../../common/wazuh-data-grid/recent-events/recent-events';

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

const getRecentEventsSpecificFilters = ({ document, indexPattern }) => {
  const file = document._source.file.path;

  return [
    PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS,
      'syscheck.path',
      file,
      indexPattern.id,
    ),
  ];
};

export const InventoryFIMRegistries = compose(
  withErrorBoundary,
  withFIMRegistriesDataSource,
)(({ agent }) => {
  return (
    <WzTableDiscover
      showSearchBar={true}
      searchBarProps={{
        showQueryInput: true,
        showQueryBar: true,
        showSaveQuery: true,
      }}
      DataSource={FIMRegistriesStatesDataSource}
      DataSourceRepositoryCreator={FIMRegistriesStatesDataSourceRepository}
      tableDefaultColumns={inventoryTableDefaultColumns}
      displayOnlyNoResultsCalloutOnNoResults={true} // TODO: review with false value not render
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
                recentEventsSpecificFilters={getRecentEventsSpecificFilters}
                DataSource={PatternDataSource}
                tableColumns={getDiscoverColumns({ agent })}
                initialFetchFilters={getImplicitFilters({
                  file: document._source.registry.path,
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
