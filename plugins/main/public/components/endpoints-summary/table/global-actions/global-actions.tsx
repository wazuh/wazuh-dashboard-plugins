import React, { useState } from 'react';
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiContextMenuItem,
} from '@elastic/eui';
import { WzElementPermissions } from '../../../common/permissions/element';
import { Agent } from '../../types';
import { EditAgentsGroupsModal } from './edit-groups/edit-groups-modal';

export interface AgentsTableGlobalActionsProps {
  selectedAgents: Agent[];
  allAgentsSelected: boolean;
  allAgentsCount: number;
  filters: any;
  allowEditGroups: boolean;
  reloadAgents: () => void;
}

export const AgentsTableGlobalActions = ({
  selectedAgents,
  allAgentsSelected,
  allAgentsCount,
  filters,
  allowEditGroups,
  reloadAgents,
}: AgentsTableGlobalActionsProps) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const [isEditGroupsVisible, setIsEditGroupsVisible] = useState(false);
  const [addOrRemoveGroups, setAddOrRemoveGroups] = useState<
    'add' | 'remove'
  >();

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const button = (
    <EuiButtonEmpty
      iconType='arrowDown'
      iconSide='right'
      onClick={onButtonClick}
    >
      Add/Remove groups
    </EuiButtonEmpty>
  );

  const totalAgents = allAgentsSelected
    ? allAgentsCount
    : selectedAgents.length;

  return (
    <>
      <EuiPopover
        id='agentsTableGlobalActions'
        button={button}
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        panelPaddingSize='none'
        anchorPosition='downLeft'
        panelStyle={{ overflowY: 'unset' }}
      >
        <EuiContextMenuPanel>
          <EuiContextMenuItem
            icon='plusInCircle'
            disabled={!totalAgents || !allowEditGroups}
            onClick={() => {
              setAddOrRemoveGroups('add');
              closePopover();
              setIsEditGroupsVisible(true);
            }}
          >
            <WzElementPermissions
              permissions={[
                {
                  action: 'group:modify_assignments',
                  resource: 'group:id:*',
                },
              ]}
            >
              <span>
                Add groups to agents
                {totalAgents ? ` (${totalAgents})` : ''}
              </span>
            </WzElementPermissions>
          </EuiContextMenuItem>
          <EuiContextMenuItem
            icon='trash'
            disabled={!selectedAgents?.length || !allowEditGroups}
            onClick={() => {
              setAddOrRemoveGroups('remove');
              closePopover();
              setIsEditGroupsVisible(true);
            }}
          >
            <WzElementPermissions
              permissions={[
                {
                  action: 'group:modify_assignments',
                  resource: 'group:id:*',
                },
              ]}
            >
              <span>
                Remove groups from agents
                {totalAgents ? ` (${totalAgents})` : ''}
              </span>
            </WzElementPermissions>
          </EuiContextMenuItem>
        </EuiContextMenuPanel>
      </EuiPopover>
      {isEditGroupsVisible ? (
        <EditAgentsGroupsModal
          selectedAgents={selectedAgents}
          allAgentsSelected={allAgentsSelected}
          filters={filters}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsEditGroupsVisible(false);
          }}
          addOrRemove={addOrRemoveGroups}
        />
      ) : null}
    </>
  );
};
