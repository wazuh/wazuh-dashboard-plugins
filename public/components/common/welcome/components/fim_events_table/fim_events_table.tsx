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

import React, { Component, useState, useEffect } from 'react'
import {
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiTable,
} from '@elastic/eui'
import { getServices } from 'plugins/kibana/discover/kibana_services';


export function FimEventsTable({ agentId, timeFilter }) {
  return (
    <EuiFlexItem>
      <EuiPanel paddingSize="m">
        <EuiTitle size="xs">
          <h1>FIM: Recent events</h1>
        </EuiTitle>
        <FimTable agentId={agentId} />
      </EuiPanel>
    </EuiFlexItem>
  )
}

function FimTable({agentId}) {
  const timeFilter = useTimeFilter();

  return null;
}

export function useTimeFilter () {
  const { timefilter, } = getServices();
  const [timeFilter, setTimeFilter] = useState(timefilter.getTime());
  useEffect(() => {
    const subscription = timefilter.getTimeUpdate$().subscribe(
      () => setTimeFilter(timefilter.getTime()));
    setTimeFilter(timefilter.getTime())
    return () => {
      subscription.unsubscribe();
    }
  }, []);
  return timeFilter;
}