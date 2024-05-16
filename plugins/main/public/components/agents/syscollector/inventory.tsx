/*
 * Wazuh app - React component to integrate plugin platform search bar
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiCallOut } from '@elastic/eui';
import { InventoryMetrics } from './components/syscollector-metrics';
import { API_NAME_AGENT_STATUS } from '../../../../common/constants';
import { compose } from 'redux';
import { withGuard } from '../../common/hocs';
import { PromptAgentNeverConnected } from '../prompts';
import {
  NetworkInterfacesTable,
  NetworkPortsTable,
  NetworkSettingsTable,
  WindowsUpdatesTable,
  ProcessesTable,
  PackagesTable,
} from './components';

export const SyscollectorInventory = compose(
  withGuard(
    props =>
      props.agent &&
      props.agent.status === API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    PromptAgentNeverConnected,
  ),
)(function SyscollectorInventory({ agent }) {
  let soPlatform;
  if (agent?.os?.uname?.includes('Linux')) {
    soPlatform = 'linux';
  } else if (agent?.os?.platform === 'windows') {
    soPlatform = 'windows';
  } else if (agent?.os?.platform === 'darwin') {
    soPlatform = 'apple';
  } else if (agent?.os?.uname?.toLowerCase().includes('freebsd')) {
    soPlatform = 'freebsd';
  } else if (agent?.os?.uname?.toLowerCase().includes('sunos')) {
    soPlatform = 'solaris';
  }

  return (
    <div style={{ overflow: 'hidden', margin: '12px 16px 12px 16px' }}>
      {agent && agent.status === API_NAME_AGENT_STATUS.DISCONNECTED && (
        <EuiFlexGroup gutterSize='s'>
          <EuiFlexItem>
            <EuiCallOut
              title='This agent is currently disconnected, the data may be outdated.'
              iconType='iInCircle'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem>
          <InventoryMetrics agent={agent}></InventoryMetrics>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem grow={2}>
          <NetworkInterfacesTable agent={agent} />
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <NetworkPortsTable agent={agent} soPlatform={soPlatform} />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem grow={3}>
          <NetworkSettingsTable agent={agent} />
        </EuiFlexItem>
        {agent && agent.os && agent.os.platform === 'windows' && (
          <EuiFlexItem grow={1}>
            <WindowsUpdatesTable agent={agent} />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem>
          <PackagesTable agent={agent} soPlatform={soPlatform} />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem>
          <ProcessesTable agent={agent} soPlatform={soPlatform} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
});
