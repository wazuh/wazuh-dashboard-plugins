import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiBadge } from '@elastic/eui';

export interface AgentGroupsProps {
  groups: string[];
}

export const AgentGroups = ({ groups }: AgentGroupsProps) => {
  return (
    <EuiFlexGroup responsive={false} wrap gutterSize='xs'>
      {groups?.map(group => (
        <EuiFlexItem grow={false}>
          <EuiBadge color='hollow'>{group}</EuiBadge>
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};
