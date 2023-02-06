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

import React, { Fragment } from 'react';
import {
  EuiEmptyPrompt,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
} from '@elastic/eui';
import { InventoryMetrics } from './components/syscollector-metrics';
import { SyscollectorTable } from './components/syscollector-table';
import { processColumns, portsColumns, packagesColumns } from './columns';
import { API_NAME_AGENT_STATUS } from '../../../../common/constants';
import { webDocumentationLink } from '../../../../common/services/web_documentation';

export function SyscollectorInventory({ agent }) {
  if (agent && agent.status === API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
    return (
      <EuiEmptyPrompt
        iconType='securitySignalDetected'
        style={{ marginTop: 20 }}
        title={<h2>Agent has never connected.</h2>}
        body={
          <Fragment>
            <p>
              The agent has been registered but has not yet connected to the
              manager.
            </p>
            <a
              href={webDocumentationLink(
                'user-manual/agents/agent-connection.html',
              )}
              target='_blank'
            >
              Checking connection with the Wazuh server
            </a>
          </Fragment>
        }
        actions={
          <EuiButton href='#/agents-preview?' color='primary' fill>
            Back
          </EuiButton>
        }
      />
    );
  }

  let soPlatform;
  if (((agent.os || {}).uname || '').includes('Linux')) {
    soPlatform = 'linux';
  } else if ((agent.os || {}).platform === 'windows') {
    soPlatform = 'windows';
  } else if ((agent.os || {}).platform === 'darwin') {
    soPlatform = 'apple';
  } else if (((agent.os || {}).uname.toLowerCase() || '').includes('freebsd')) {
    soPlatform = 'freebsd';
  } else if (((agent.os || {}).uname.toLowerCase() || '').includes('sunos')) {
    soPlatform = 'solaris';
  }

  const netifaceColumns = [
    { id: 'name' },
    { id: 'mac' },
    { id: 'state', value: 'State' },
    { id: 'mtu', value: 'MTU' },
    { id: 'type', value: 'Type' },
  ];
  const netaddrColumns = [
    { id: 'iface' },
    { id: 'address' },
    { id: 'netmask' },
    { id: 'proto' },
    { id: 'broadcast' },
  ];

  return (
    <div style={{ overflow: 'hidden' }}>
      {agent && agent.status === API_NAME_AGENT_STATUS.DISCONNECTED && (
        <EuiCallOut
          style={{ margin: '8px 16px 8px 16px' }}
          title='This agent is currently disconnected, the data may be outdated.'
          iconType='iInCircle'
        />
      )}
      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem style={{ marginBottom: 0 }}>
          <InventoryMetrics agent={agent}></InventoryMetrics>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem grow={2} style={{ marginRight: 4, marginTop: 0 }}>
          <SyscollectorTable
            tableParams={{
              path: `/syscollector/${agent.id}/netiface`,
              title: 'Network interfaces',
              columns: netifaceColumns,
              icon: 'indexMapping',
              searchBar: false,
              exportFormatted: false,
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={2} style={{ marginLeft: 4, marginTop: 0 }}>
          <SyscollectorTable
            tableParams={{
              path: `/syscollector/${agent.id}/ports`,
              title: 'Network ports',
              columns: portsColumns[soPlatform],
              icon: 'inputOutput',
              searchBar: true,
              exportFormatted: false,
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem grow={3} style={{ marginRight: 4 }}>
          <SyscollectorTable
            tableParams={{
              path: `/syscollector/${agent.id}/netaddr`,
              title: 'Network settings',
              columns: netaddrColumns,
              icon: 'controlsHorizontal',
              searchBar: false,
              exportFormatted: false,
            }}
          />
        </EuiFlexItem>
        {agent && agent.os && agent.os.platform === 'windows' && (
          <EuiFlexItem grow={1} style={{ marginLeft: 4 }}>
            <SyscollectorTable
              tableParams={{
                path: `/syscollector/${agent.id}/hotfixes`,
                title: 'Windows updates',
                columns: [{ id: 'hotfix' }],
                icon: 'logoWindows',
                searchBar: false,
                exportFormatted: false,
              }}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem>
          <SyscollectorTable
            tableParams={{
              path: `/syscollector/${agent.id}/packages`,
              hasTotal: true,
              title: 'Packages',
              columns: packagesColumns[soPlatform],
              icon: 'apps',
              searchBar: true,
              exportFormatted: 'packages.csv',
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem>
          <SyscollectorTable
            tableParams={{
              path: `/syscollector/${agent.id}/processes`,
              hasTotal: true,
              title: 'Processes',
              columns: processColumns[soPlatform],
              icon: 'console',
              searchBar: true,
              exportFormatted: 'processes.csv',
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
}
