import React, { useState } from 'react';
import {
  EuiPopover,
  EuiButton,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiHorizontalRule,
  EuiToolTip,
} from '@elastic/eui';
import { AgentManagement } from '../../../../services/agent-management';
import { Agent } from '../../../../../common/types';
import { ConfirmModal } from '../../../common/confirm-modal/confirm-modal';
import { EditAgentsGroupsModal } from './edit-groups/edit-groups-modal';
import { UpgradeAgentsModal } from './upgrade/upgrade-modal';

export interface AgentsTableGlobalActionsProps {
  selectedAgents: Agent[];
  // allAgentsSelected: boolean;
  // filters: any;
  allowEditGroups: boolean;
  allowUpgrade: boolean;
  allowGetTasks: boolean;
  allowDeleteAgent: boolean;
  reloadAgents: () => void;
  // setIsUpgradeTasksModalVisible: (isModalVisible: boolean) => void;
  // setIsUpgradePanelClosed: (isUpgradePanelClosed: boolean) => void;
}

export const AgentsTableGlobalActions = ({
  selectedAgents,
  // allAgentsSelected,
  // filters,
  allowEditGroups,
  allowUpgrade,
  allowGetTasks,
  allowDeleteAgent,
  reloadAgents,
  // setIsUpgradeTasksModalVisible,
  // setIsUpgradePanelClosed,
}: AgentsTableGlobalActionsProps) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const [isEditGroupsVisible, setIsEditGroupsVisible] = useState(false);
  const [isDeleteAgentsVisible, setIsDeleteAgentsVisible] = useState(false);
  const [addOrRemoveGroups, setAddOrRemoveGroups] = useState<
    'add' | 'remove'
  >();
  const [isUpgradeAgentsVisible, setIsUpgradeAgentsVisible] = useState(false);

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const confirmDelete = () => {
    AgentManagement().delete(selectedAgents.map(agent => agent.agent.id));
    setIsDeleteAgentsVisible(false);
  };

  const button = (
    <EuiButton iconType='arrowDown' iconSide='right' onClick={onButtonClick}>
      Actions
    </EuiButton>
  );
  const totalAgents = selectedAgents.length;
  const selectAgentsTooltip = (content: React.ReactNode) => (
    <EuiToolTip content='Select agents to perfom the action'>
      <span>{content}</span>
    </EuiToolTip>
  );
  const actions = {
    addGroups: 'Add groups to agents',
    removeGroups: 'Remove groups from agents',
    upgrade: 'Upgrade agents',
    upgradeDetails: 'Upgrade task details',
    delete: 'Delete agents',
  };

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
            icon='trash'
            disabled={!totalAgents || !allowDeleteAgent}
            onClick={() => {
              setIsDeleteAgentsVisible(true);
              closePopover();
            }}
          >
            {allowDeleteAgent && !totalAgents ? (
              selectAgentsTooltip(actions.delete)
            ) : (
              <span>
                {actions.delete}
                {totalAgents ? ` (${totalAgents})` : ''}
              </span>
            )}
          </EuiContextMenuItem>
          <EuiHorizontalRule margin='xs' />
          <EuiContextMenuItem
            icon='plusInCircle'
            disabled={!totalAgents || !allowEditGroups}
            onClick={() => {
              setAddOrRemoveGroups('add');
              closePopover();
              setIsEditGroupsVisible(true);
            }}
          >
            {allowEditGroups && !totalAgents ? (
              selectAgentsTooltip(actions.addGroups)
            ) : (
              <span>
                {actions.addGroups}
                {totalAgents ? ` (${totalAgents})` : ''}
              </span>
            )}
          </EuiContextMenuItem>
          <EuiContextMenuItem
            icon='trash'
            disabled={!totalAgents || !allowEditGroups}
            onClick={() => {
              setAddOrRemoveGroups('remove');
              closePopover();
              setIsEditGroupsVisible(true);
            }}
          >
            {allowEditGroups && !totalAgents ? (
              selectAgentsTooltip(actions.removeGroups)
            ) : (
              <span>
                {actions.removeGroups}
                {totalAgents ? ` (${totalAgents})` : ''}
              </span>
            )}
          </EuiContextMenuItem>
          <EuiHorizontalRule margin='xs' />
          <EuiContextMenuItem
            icon='package'
            disabled={!totalAgents || !allowUpgrade}
            onClick={() => {
              closePopover();
              setIsUpgradeAgentsVisible(true);
            }}
          >
            {allowUpgrade && !totalAgents ? (
              selectAgentsTooltip(actions.upgrade)
            ) : (
              <span>
                {actions.upgrade}
                {totalAgents ? ` (${totalAgents})` : ''}
              </span>
            )}
          </EuiContextMenuItem>
          <EuiContextMenuItem
            icon='eye'
            disabled={!allowGetTasks}
            onClick={() => {
              closePopover();
              // setIsUpgradeTasksModalVisible(true);
            }}
          >
            <span>{actions.upgradeDetails}</span>
          </EuiContextMenuItem>
        </EuiContextMenuPanel>
      </EuiPopover>
      {isEditGroupsVisible && (
        <EditAgentsGroupsModal
          selectedAgents={selectedAgents}
          // allAgentsSelected={allAgentsSelected}
          // filters={filters}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsEditGroupsVisible(false);
          }}
          addOrRemove={addOrRemoveGroups}
        />
      )}
      {isUpgradeAgentsVisible && (
        <UpgradeAgentsModal
          selectedAgents={selectedAgents}
          // allAgentsSelected={allAgentsSelected}
          // filters={filters}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsUpgradeAgentsVisible(false);
          }}
          // setIsUpgradePanelClosed={setIsUpgradePanelClosed}
        />
      )}
      <ConfirmModal
        isVisible={isDeleteAgentsVisible}
        title='Delete agent'
        message='Are you sure you want to delete this agent?'
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteAgentsVisible(false)}
        confirmButtonText='Delete'
        buttonColor='danger'
      />
    </>
  );
};
