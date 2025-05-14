import React from 'react';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../common/data-source';
import { AppState, formatUIDate } from '../../../../react-services';
import { getCore } from '../../../../kibana-services';
import { EuiLink } from '@elastic/eui';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER } from '../../../../../common/constants';
import { endpointSummary, rules } from '../../../../utils/applications';
import TechniqueRowDetails from '../../mitre/framework/components/techniques/components/flyout-technique/technique-row-details';
import { setFilters } from '../../../common/search-bar/set-filters';
import { buildPhraseFilter } from '../../../../../../../src/plugins/data/common';

export function getDiscoverColumns({ agent }) {
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

export function getImplicitFilters({ file }: { file: string }) {
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
    /* WORKAROUND: this uses a wildcard query, because the alerts contain a prefix related
      to the hive (HKEY_LOCAL_MACHINE, etc...), that is not included in the registr.key used
      as "file" parameter of this method. The registry.hive of inventory data includes a reference
      to the hive but this uses an acronym (HKLM instead of HKEY_LOCAL_MACHINE) in the current
      state, so we could not rebuild the expected syscheck.path in the alert. This should be
      changed if:
      - the registry.hive is fixed to represent the real hive name (HKEY_LOCAL_MACHINE, etc...)
        composing the syscheck.path = registry.hive + "\" + registry.key
      - registry.key or other property includes all the path to the registry.key so the
        syscheck.path = registry.key or <related_prop>

      See: https://github.com/wazuh/wazuh/issues/27903#issuecomment-2879882694
    */
    PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.WILDCARD,
      'syscheck.path',
      `*${file.split('\\').join(String.raw`\\`)}`,
      AppState.getCurrentPattern(),
    ),
  ];
}

export function renderDiscoverExpandedRow(props: {
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

export const getRecentEventsSpecificFilters = ({ document, indexPattern }) => {
  const file = document._source.registry.key;

  return [
    /* WORKAROUND: this uses a wildcard query, because the alerts contain a prefix related
      to the hive (HKEY_LOCAL_MACHINE, etc...), that is not included in the registr.key used
      as "file" parameter of this method. The registry.hive of inventory data includes a reference
      to the hive but this uses an acronym (HKLM instead of HKEY_LOCAL_MACHINE) in the current
      state, so we could not rebuild the expected syscheck.path in the alert. This should be
      changed if:
      - the registry.hive is fixed to represent the real hive name (HKEY_LOCAL_MACHINE, etc...)
        composing the syscheck.path = registry.hive + "\" + registry.key
      - registry.key or other property includes all the path to the registry.key so the
        syscheck.path = registry.key or <related_prop>

      See: https://github.com/wazuh/wazuh/issues/27903#issuecomment-2879882694
    */
    PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.WILDCARD,
      'syscheck.path',
      `*${file.split('\\').join(String.raw`\\`)}`,
      indexPattern.id,
    ),
    // PatternDataSourceFilterManager.createFilter(
    //   FILTER_OPERATOR.IS,
    //   'syscheck.path',
    //   file,
    //   indexPattern.id,
    // ),
  ];
};
