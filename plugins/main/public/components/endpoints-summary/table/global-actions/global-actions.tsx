import React, { useState } from 'react';
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiContextMenuItem,
} from '@elastic/eui';
import { WzElementPermissions } from '../../../common/permissions/element';
import { Agent } from '../../types';
import { EditAgentsGroupsModal } from './edit-groups-modal';

export interface AgentsTableGlobalActionsProps {
  agents: Agent[];
  allowEditGroups: boolean;
  reloadAgents: () => void;
}

export const AgentsTableGlobalActions = ({
  agents,
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
            disabled={!agents?.length || !allowEditGroups}
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
              <span>Add groups to agents</span>
            </WzElementPermissions>
          </EuiContextMenuItem>
          <EuiContextMenuItem
            icon='trash'
            disabled={!agents?.length || !allowEditGroups}
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
              <span>Remove groups from agents</span>
            </WzElementPermissions>
          </EuiContextMenuItem>
        </EuiContextMenuPanel>
      </EuiPopover>
      {isEditGroupsVisible ? (
        <EditAgentsGroupsModal
          agents={agents}
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
