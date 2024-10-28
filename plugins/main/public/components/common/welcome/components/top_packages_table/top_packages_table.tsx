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
  EuiFlexGroup,
} from '@elastic/eui';
// @ts-ignore
import { getDataPlugin } from '../../../../../kibana-services';
import { vulnerabilityDetection } from '../../../../../utils/applications';
import {
  PatternDataSourceFilterManager,
  FILTER_OPERATOR,
} from '../../../data-source';
import { WzLink } from '../../../../../components/wz-link/wz-link';

export function VulsTopPackageTable({ agentId, items, indexPatternId }) {
  const [sort, setSort] = useState({
    field: 'doc_count',
    direction: 'desc',
  });

  const columns = [
    {
      field: 'key',
      name: 'Package',
      sortable: true,
      render: field => (
        <WzLink
          appId={vulnerabilityDetection.id}
          path={`/overview?tab=vuls&tabView=dashboard&agentId=${agentId}&_g=${PatternDataSourceFilterManager.filtersToURLFormat(
            [
              PatternDataSourceFilterManager.createFilter(
                FILTER_OPERATOR.IS,
                `package.name`,
                field,
                indexPatternId,
              ),
            ],
          )}`}
        >
          {field}
        </WzLink>
      ),
    },
    {
      field: 'doc_count',
      name: 'Count',
      sortable: true,
      truncateText: true,
      width: '100px',
    },
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
