/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect } from 'react'
import {
  EuiBasicTable,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui'
// @ts-ignore
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { getFimAlerts } from './lib';
import { TimeService } from '../../../../../react-services/time-service';

export function FimEventsTable({ agentId }) {
  return (
    <EuiFlexItem>
      <EuiPanel paddingSize="m">
        <EuiTitle size="xs">
          <h1>FIM: Recent events</h1>
        </EuiTitle>
        <EuiSpacer size="l" />
        <FimTable agentId={agentId} />
      </EuiPanel>
    </EuiFlexItem>
  );
}

export function useTimeFilter () {
  const { timefilter, } = getServices();
  const [timeFilter, setTimeFilter] = useState(timefilter.getTime());
  useEffect(() => {
    const subscription = timefilter.getTimeUpdate$().subscribe(
      () => setTimeFilter(timefilter.getTime()));
    return () => { subscription.unsubscribe(); }
  }, []);
  return timeFilter;
}

function FimTable({agentId}) {
  const [fimAlerts, setFimAlerts] = useState([]);
  const [sort, setSort] = useState({field:'_source.timestamp', direction: 'desc'});
  const timeFilter = useTimeFilter();
  useEffect(() => {getFimAlerts(agentId, timeFilter, sort).then(setFimAlerts)}, [timeFilter, sort]);
  return (
    <EuiBasicTable
      items={fimAlerts}
      columns={columns}
      loading={false}
      sorting={{sort}}
      onChange={(e) => setSort(e.sort)}
      itemId="fim-alerts"
      noItemsMessage="No recent events" />);
}

const columns = [
  {field: '_source.timestamp', name:"Time", sortable: true, render: (field) => TimeService.offset(field), width: '150px' },
  {field: '_source.syscheck.path', name:"Path", sortable: true, truncateText: true },
  {field: '_source.syscheck.event', name:"Action", sortable: true, width: '100px' },
  {field: '_source.rule.description', name:"Rule description", sortable: true, truncateText: true },
  {field: '_source.rule.level', name:"Rule Level", sortable: true, width: '75px' },
  {field: '_source.rule.id', name:"Rule Id", sortable: true, width: '75px' },
]