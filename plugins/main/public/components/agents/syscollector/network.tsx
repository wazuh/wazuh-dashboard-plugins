import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import {
  NetworkInterfacesTable,
  NetworkPortsTable,
  NetworkSettingsTable,
} from './components';
import { Agent } from '../../endpoints-summary/types';

interface NetworkProps {
  agent: Agent;
  soPlatform?: string;
}

const NetworkTab = ({ agent, soPlatform }: NetworkProps) => {
  return (
    <EuiFlexGroup direction='column' gutterSize='s'>
      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem grow={2}>
          <NetworkInterfacesTable agent={agent} />
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <NetworkPortsTable agent={agent} soPlatform={soPlatform} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexItem style={{ marginInline: 0, marginTop: 8 }}>
        <NetworkSettingsTable agent={agent} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export default NetworkTab;
