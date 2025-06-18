import React, { useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiFlexGrid,
  EuiLink,
  EuiBadge,
} from '@elastic/eui';

export interface AgentGroupsProps {
  groups: string[];
  strLength?: number;
}

const renderBadge = (group: string, index: number) => (
  <EuiBadge
    color={'hollow'}
    key={`agent-group-${index}`}
    onClickAriaLabel={`agent-group-${index}`}
  >
    {group}
  </EuiBadge>
);

export const AgentGroups = ({ groups, strLength = 15 }: AgentGroupsProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const auxGroups: React.ReactNode[] = [];
  const tooltipGroups: React.ReactNode[] = [];
  let auxLength = 0;
  let auxIndex = 0;

  if (groups.length >= 2 && groups.toString().length >= strLength) {
    groups.map((group, index) => {
      auxLength = auxLength + group.length;

      if (auxLength >= strLength) {
        tooltipGroups.push(
          <EuiFlexItem grow={1} key={`agent-group-${index}`}>
            {renderBadge(group, index)}
          </EuiFlexItem>,
        );
        ++auxIndex;
      } else {
        auxGroups.push(renderBadge(group, index));
      }
    });
  } else {
    groups.map((group, index) => {
      auxGroups.push(renderBadge(group, index));
    });
  }

  return (
    <span style={{ display: 'inline' }}>
      <>{auxGroups}</>
      {auxIndex > 0 && (
        <EuiPopover
          button={
            <EuiLink
              style={{ textDecoration: 'none', fontWeight: 'normal' }}
              className={'no-focus'}
              onMouseDown={(event: React.MouseEvent) => {
                event.stopPropagation();
              }}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                setPopoverOpen(!popoverOpen);
              }}
            >
              &nbsp;{`+${auxIndex} more`}
            </EuiLink>
          }
          isOpen={popoverOpen}
          closePopover={() => setPopoverOpen(!popoverOpen)}
        >
          <EuiFlexGroup style={{ maxWidth: '500px' }} gutterSize='none'>
            <EuiFlexItem grow={false}>
              <EuiFlexGrid columns={4} gutterSize={'s'}>
                {tooltipGroups}
              </EuiFlexGrid>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPopover>
      )}
    </span>
  );
};
