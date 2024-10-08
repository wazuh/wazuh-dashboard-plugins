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

import React, { useState, useEffect, Fragment } from 'react';
import {
  EuiBasicTable,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiToolTip,
  EuiLink
} from '@elastic/eui';
// @ts-ignore
import { getCore, getDataPlugin } from '../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { vulnerabilityDetection } from '../../../../../utils/applications';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';
import NavigationService from '../../../../../react-services/navigation-service';
import {
  PatternDataSourceFilterManager,
  FILTER_OPERATOR,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
  VulnerabilitiesDataSourceRepository,
  VulnerabilitiesDataSource
} from '../../../data-source';
import { WAZUH_MODULES } from '../../../../../../common/wazuh-modules';

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


export function VulsTopPackageTable({ agentId, items, indexPatternId }) {
  const [sort, setSort] = useState({
    field: 'doc_count',
    direction: 'desc',
  });
  const [data, setData] = useState([]);
  const timeFilter = useTimeFilter();

  const columns = [
    {
      field: 'key',
      name: 'Package',
      sortable: true,
      render: field => (
        <EuiLink
          className='euiTableCellContent__text euiTableCellContent--truncateText'
          href={NavigationService.getInstance().getUrlForApp(
            vulnerabilityDetection.id,
            {
              path: `tab=vuls&tabView=dashboard&agentId=${agentId
                }&_g=${PatternDataSourceFilterManager.filtersToURLFormat([
                  PatternDataSourceFilterManager.createFilter(
                    FILTER_OPERATOR.IS,
                    `package.name`,
                    field,
                    indexPatternId,
                  ),
                ])}`
            },
          )}
        >
          {field}
        </EuiLink>
      )
    },
    {
      field: 'doc_count',
      name: 'Count',
      sortable: true,
      truncateText: true,
      width: '100px',
    }
  ];

  return (
    <EuiPanel paddingSize='s'>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiText size='xs'>
            <h2>Top 5 Packages</h2>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='s' />
      <EuiBasicTable
        items={items}
        columns={columns}
        loading={false}
        sorting={{ sort }}
        onChange={e => setSort(e.sort)}
        itemId='top-packages-table'
        noItemsMessage='No recent events'
      />
    </EuiPanel>
  );
}


