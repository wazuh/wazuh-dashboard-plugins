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
import { i18n } from '@osd/i18n';
import {
  EuiBasicTable,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiToolTip,
} from '@elastic/eui';
import { Typography } from '../../../typography/typography';
import { getCore, getDataPlugin } from '../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { fileIntegrityMonitoring } from '../../../../../utils/applications';
import NavigationService from '../../../../../react-services/navigation-service';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';
import { withDataSourceFetch } from '../../../hocs';
import { FIMDataSourceRepository, FIMDataSource } from '../../../data-source';
import { formatUIDate } from '../../../../../react-services';

export function FimEventsTable({ agent }) {
  return (
    <EuiFlexItem>
      <EuiPanel paddingSize='m'>
        <EuiFlexItem>
          <EuiFlexGroup responsive={false}>
            <EuiFlexItem>
              <Typography level='section'>
                {i18n.translate('wazuh.common.agentWelcomeFimTable.title', {
                  defaultMessage: 'FIM: Recent files',
                })}
              </Typography>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip
                position='top'
                content={i18n.translate(
                  'wazuh.common.agentWelcomeFimTable.openApp',
                  {
                    defaultMessage: 'Open FIM',
                  },
                )}
              >
                <RedirectAppLinks application={getCore().application}>
                  <EuiButtonIcon
                    iconType='popout'
                    color='primary'
                    onClick={() => navigateToFim(agent)}
                    href={NavigationService.getInstance().getAppURL(
                      fileIntegrityMonitoring.id,
                    )}
                    aria-label={i18n.translate(
                      'wazuh.common.agentWelcomeFimTable.openApp',
                      {
                        defaultMessage: 'Open FIM',
                      },
                    )}
                  />
                </RedirectAppLinks>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='m' />
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
  DataSourceRepositoryCreator: FIMDataSourceRepository,
  mapRequestParams: ({ dataSource, dependencies }) => {
    const [_, sort] = dependencies;

    const sortSearch = [
      { id: sort.field.substring(8), direction: sort.direction },
    ];
    return {
      query: { query: '', language: 'kuery' },
      filters: [...dataSource.fetchFilters],
      pagination: {
        pageIndex: 0,
        pageSize: 5,
      },
      sorting: {
        columns: sortSearch,
      },
    };
  },
  mapFetchActionDependencies: ({ sort }) => [
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
      noItemsMessage={i18n.translate(
        'wazuh.common.agentWelcomeFimTable.noItems',
        { defaultMessage: 'No recent documents' },
      )}
    />
  );
});

function FimTable({ agent }) {
  const [sort, setSort] = useState({
    field: '_source.file.mtime',
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
    field: '_source.file.mtime',
    name: i18n.translate(
      'wazuh.common.agentWelcomeFimTable.columns.modifiedTime',
      {
        defaultMessage: 'Modified time',
      },
    ),
    sortable: true,
    width: '300px',
    render: formatUIDate,
  },
  {
    field: '_source.file.path',
    name: i18n.translate('wazuh.common.agentWelcomeFimTable.columns.filePath', {
      defaultMessage: 'File path',
    }),
    sortable: true,
    truncateText: true,
  },
  {
    field: '_source.file.owner',
    name: i18n.translate(
      'wazuh.common.agentWelcomeFimTable.columns.fileOwner',
      {
        defaultMessage: 'File owner',
      },
    ),
    sortable: true,
  },
  {
    field: '_source.file.uid',
    name: i18n.translate(
      'wazuh.common.agentWelcomeFimTable.columns.fileUserId',
      {
        defaultMessage: 'File user ID',
      },
    ),
    sortable: true,
    truncateText: true,
  },
  // TODO: Add file.size column using the index pattern byte formatter
];
