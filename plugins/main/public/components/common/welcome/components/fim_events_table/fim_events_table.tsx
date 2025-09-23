/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect } from 'react';
import {
  EuiBasicTable,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiToolTip,
} from '@elastic/eui';
// @ts-ignore
import { formatUIDate } from '../../../../../react-services/time-service';
import { FlyoutDetail } from '../../../../agents/fim/inventory/flyout';
import { EuiLink } from '@elastic/eui';
import { getCore, getDataPlugin } from '../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { fileIntegrityMonitoring } from '../../../../../utils/applications';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';
import NavigationService from '../../../../../react-services/navigation-service';
import { withDataSourceFetch } from '../../../hocs';
import {
  AlertsDataSourceRepository,
  FIMDataSource,
} from '../../../data-source';

export function FimEventsTable({ agent }) {
  return (
    <EuiFlexItem>
      <EuiPanel paddingSize='m'>
        <EuiFlexItem>
          <EuiFlexGroup responsive={false}>
            <EuiFlexItem>
              <EuiText size='xs'>
                <h2>FIM: Recent events</h2>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip position='top' content='Open FIM'>
                <RedirectAppLinks application={getCore().application}>
                  <EuiButtonIcon
                    iconType='popout'
                    color='primary'
                    onClick={() => navigateToFim(agent)}
                    href={`${NavigationService.getInstance().getUrlForApp(
                      fileIntegrityMonitoring.id,
                    )}`}
                    aria-label='Open FIM'
                  />
                </RedirectAppLinks>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='s' />
          <FimTable agent={agent} />
        </EuiFlexItem>
      </EuiPanel>
    </EuiFlexItem>
  );
}

export function useTimeFilter() {
  const { timefilter } = getDataPlugin().query.timefilter;
  const [timeFilter, setTimeFilter] = useState(timefilter.getTime());
  useEffect(() => {
    const subscription = timefilter
      .getTimeUpdate$()
      .subscribe(() => setTimeFilter(timefilter.getTime()));
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return timeFilter;
}

const FimTableDataSource = withDataSourceFetch({
  DataSource: FIMDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  mapRequestParams: ({ dataSource, dependencies }) => {
    const [_, timeFilter, sort] = dependencies;

    const sortSearch = [
      { id: sort.field.substring(8), direction: sort.direction },
    ];
    return {
      query: { query: '', language: 'kuery' },
      filters: [...dataSource.fetchFilters],
      dateRange: timeFilter,
      pagination: {
        pageIndex: 0,
        pageSize: 5,
      },
      sorting: {
        columns: sortSearch,
      },
    };
  },
  mapFetchActionDependencies: ({ timeFilter, sort }) => [
    timeFilter,
    sort,
    /* Changing the agent causes the fetchFilters change, and the HOC manage this case so it is not
    requried adding the agent to the dependencies */
  ],
  mapResponse: response => {
    return { total: response?.hits?.total, items: response?.hits?.hits };
  },
  FetchingDataComponent: () => null,
})(({ dataSourceAction, sort, setSort }) => {
  return (
    <EuiBasicTable
      items={dataSourceAction?.data?.items || []}
      columns={columns}
      loading={false}
      sorting={{ sort }}
      onChange={e => setSort(e.sort)}
      itemId='fim-alerts'
      noItemsMessage='No recent events'
    />
  );
});

function FimTable({ agent }) {
  const [sort, setSort] = useState({
    field: '_source.timestamp',
    direction: 'desc',
  });

  const timeFilter = useTimeFilter();
  return (
    <FimTableDataSource
      agent={agent}
      timeFilter={timeFilter}
      sort={sort}
      setSort={setSort}
    />
  );
}

function navigateToFim(agent) {
  const pinnedAgentManager = new PinnedAgentManager();
  pinnedAgentManager.pinAgent(agent);
}

const columns = [
  {
    field: '_source.timestamp',
    name: 'Time',
    sortable: true,
    render: field => formatUIDate(field),
    width: '150px',
  },
  {
    field: '_source.syscheck.path',
    name: 'Path',
    sortable: true,
    truncateText: true,
  },
  {
    field: '_source.syscheck.event',
    name: 'Action',
    sortable: true,
    width: '100px',
  },
  {
    field: '_source.rule.description',
    name: 'Rule description',
    sortable: true,
    truncateText: true,
  },
  {
    field: '_source.rule.level',
    name: 'Rule Level',
    sortable: true,
    width: '75px',
  },
  { field: '_source.rule.id', name: 'Rule Id', sortable: true, width: '75px' },
];

const renderPath = (path, setFile, setIsOpen) => (
  <EuiLink
    className='euiTableCellContent__text euiTableCellContent--truncateText'
    onClick={() => {
      setFile(path), setIsOpen(true);
    }}
  >
    {path}
  </EuiLink>
);
