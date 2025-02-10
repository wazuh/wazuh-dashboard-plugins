import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiBadge } from '@elastic/eui';

export interface AgentGroupsProps {
  groups: string[];
}

export const AgentGroups = ({ groups }: AgentGroupsProps) => (
  <EuiFlexGroup responsive={false} wrap gutterSize='xs'>
    {groups?.map((group, index) => (
      <EuiFlexItem key={`${group}-${index}`} grow={false}>
        <EuiBadge color='hollow'>{group}</EuiBadge>
      </EuiFlexItem>
    ))}
  </EuiFlexGroup>
);
