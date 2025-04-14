import React, { useState } from 'react';
import {
  EuiPopover,
  EuiButton,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiHorizontalRule,
  EuiToolTip,
} from '@elastic/eui';
import { getAgentManagement } from '../../../../plugin-services';
import { IAgentResponse } from '../../../../../common/types';
import { ConfirmModal } from '../../../common/confirm-modal/confirm-modal';
import { EditAgentsGroupsModal } from './edit-groups/edit-groups-modal';
import { UpgradeAgentsModal } from './upgrade/upgrade-modal';
import { EditActionGroups } from './edit-groups/types';

export interface AgentsTableGlobalActionsProps {
  selectedAgents: IAgentResponse[];
  allAgentsSelected: boolean;
  params: object;
  allowEditGroups: boolean;
  allowUpgrade: boolean;
  allowGetTasks: boolean;
  allowDeleteAgent: boolean;
  reloadAgents: () => void;
  setSelectedAgents: () => void;
}

export const AgentsTableGlobalActions = ({
  selectedAgents: test,
  allAgentsSelected,
  params,
  allowEditGroups,
  allowUpgrade,
  allowDeleteAgent,
  reloadAgents,
  setSelectedAgents,
}: AgentsTableGlobalActionsProps) => {
  const selectedAgents = [...test];
  const [isPopoverOpen, setPopover] = useState(false);
  const [isEditGroupsVisible, setIsEditGroupsVisible] = useState(false);
  const [isDeleteAgentsVisible, setIsDeleteAgentsVisible] = useState(false);
  const [editActionGroups, setEditActionGroups] = useState<EditActionGroups>(
    EditActionGroups.ADD,
  );
  const [isUpgradeAgentsVisible, setIsUpgradeAgentsVisible] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const confirmDelete = async () => {
    try {
      setIsLoadingModal(true);
      await getAgentManagement().delete(selectedAgents.map(agent => agent._id));
      setIsLoadingModal(false);
      setIsDeleteAgentsVisible(false);
    } catch {
      setIsLoadingModal(false);
    }
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
              setEditActionGroups(EditActionGroups.ADD);
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
              setEditActionGroups(EditActionGroups.REMOVE);
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
        </EuiContextMenuPanel>
      </EuiPopover>
      {isEditGroupsVisible && (
        <EditAgentsGroupsModal
          selectedAgents={selectedAgents}
          allAgentsSelected={allAgentsSelected}
          params={params}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsEditGroupsVisible(false);
          }}
          editAction={editActionGroups}
        />
      )}
      {isUpgradeAgentsVisible && (
        <UpgradeAgentsModal
          selectedAgents={selectedAgents}
          setSelectedAgents={setSelectedAgents}
          allAgentsSelected={allAgentsSelected}
          params={params}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsUpgradeAgentsVisible(false);
          }}
          // setIsUpgradePanelClosed={setIsUpgradePanelClosed}
        />
      )}
      {/*
        TODO: Display as upgrade modal
      */}
      <ConfirmModal
        isVisible={isDeleteAgentsVisible}
        title='Delete agents'
        message='Are you sure you want to delete this agent?'
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteAgentsVisible(false)}
        confirmButtonText='Delete'
        buttonColor='danger'
        isLoading={isLoadingModal}
      />
    </>
  );
};
