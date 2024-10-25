import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ProcessesTable } from './components';
import { Agent } from '../../endpoints-summary/types';

interface ProcessesProps {
  agent: Agent;
  soPlatform?: string;
}

const ProcessesTab = ({ agent, soPlatform }: ProcessesProps) => {
  return (
    <EuiFlexGroup direction='column' gutterSize='s'>
      <EuiFlexItem>
        <ProcessesTable agent={agent} soPlatform={soPlatform} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export default ProcessesTab;
