import React from 'react';
import { Agent } from '../../endpoints-summary/types';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { PackagesTable, WindowsUpdatesTable } from './components';

interface SoftwareProps {
  agent: Agent;
  soPlatform?: string;
}

const SoftwareTab = ({ agent, soPlatform }: SoftwareProps) => {
  return (
    <EuiFlexGroup direction='column' gutterSize='s'>
      {agent?.os?.platform === 'windows' && (
        <EuiFlexItem>
          <WindowsUpdatesTable agent={agent} />
        </EuiFlexItem>
      )}
      <EuiFlexItem>
        <PackagesTable agent={agent} soPlatform={soPlatform} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export default SoftwareTab;
