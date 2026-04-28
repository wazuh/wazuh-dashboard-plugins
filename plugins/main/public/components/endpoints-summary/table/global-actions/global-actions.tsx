import React, { useState } from 'react';
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiHorizontalRule,
  EuiToolTip,
} from '@elastic/eui';
import { WzElementPermissions } from '../../../common/permissions/element';
import { Agent } from '../../types';
import { EditAgentsGroupsModal } from './edit-groups/edit-groups-modal';
import { UpgradeAgentsModal } from './upgrade/upgrade-modal';
import { RemoveAgentsModal } from './remove/remove-modal';

export interface AgentsTableGlobalActionsProps {
  selectedAgents: Agent[];
  allAgentsSelected: boolean;
  allAgentsCount: number;
  filters: any;
  allowEditGroups: boolean;
  allowGetTasks: boolean;
  reloadAgents: () => void;
  setIsUpgradeTasksModalVisible: (isModalVisible: boolean) => void;
  setIsUpgradePanelClosed: (isUpgradePanelClosed: boolean) => void;
}

export const AgentsTableGlobalActions = ({
  selectedAgents,
  allAgentsSelected,
  allAgentsCount,
  filters,
  allowEditGroups,
  allowGetTasks,
  reloadAgents,
  setIsUpgradeTasksModalVisible,
  setIsUpgradePanelClosed,
}: AgentsTableGlobalActionsProps) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const [isEditGroupsVisible, setIsEditGroupsVisible] = useState(false);
  const [addOrRemoveGroups, setAddOrRemoveGroups] = useState<
    'add' | 'remove'
  >();
  const [isUpgradeAgentsVisible, setIsUpgradeAgentsVisible] = useState(false);
  const [isRemoveAgentsModalVisible, setIsRemoveAgentsModalVisible] =
    useState(false);

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
      More
    </EuiButtonEmpty>
  );

  const totalAgents = allAgentsSelected
    ? allAgentsCount
    : selectedAgents.length;

  const selectAgentsTooltip = (content: React.ReactNode) => (
    <EuiToolTip content='Select agents to perfom the action'>
      <span>{content}</span>
    </EuiToolTip>
  );

  const actions = {
    addGroups: 'Add groups to agents',
    removeGroups: 'Remove groups from agents',
    upgrade: 'Upgrade agents',
    remove: 'Remove agents',
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
              <WzElementPermissions
                permissions={[
                  {
                    action: 'group:modify_assignments',
                    resource: 'group:id:*',
                  },
                ]}
              >
                <span>
                  {actions.addGroups}
                  {totalAgents ? ` (${totalAgents})` : ''}
                </span>
              </WzElementPermissions>
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
              <WzElementPermissions
                permissions={[
                  {
                    action: 'group:modify_assignments',
                    resource: 'group:id:*',
                  },
                ]}
              >
                <span>
                  {actions.removeGroups}
                  {totalAgents ? ` (${totalAgents})` : ''}
                </span>
              </WzElementPermissions>
            )}
          </EuiContextMenuItem>
          <EuiHorizontalRule margin='xs' />
          <EuiContextMenuItem
            icon='package'
            disabled={!totalAgents}
            onClick={() => {
              closePopover();
              setIsUpgradeAgentsVisible(true);
            }}
          >
            {!totalAgents ? (
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
              setIsUpgradeTasksModalVisible(true);
            }}
          >
            <WzElementPermissions
              permissions={[
                {
                  action: 'task:status',
                  resource: '*:*:*',
                },
              ]}
            >
              <span>Upgrade task details</span>
            </WzElementPermissions>
          </EuiContextMenuItem>
          <EuiHorizontalRule margin='xs' />
          <EuiContextMenuItem
            icon='trash'
            disabled={!totalAgents}
            onClick={() => {
              closePopover();
              setIsRemoveAgentsModalVisible(true);
            }}
          >
            {!totalAgents ? (
              selectAgentsTooltip(actions.remove)
            ) : (
              <span>
                {actions.remove}
                {totalAgents ? ` (${totalAgents})` : ''}
              </span>
            )}
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
      {isUpgradeAgentsVisible ? (
        <UpgradeAgentsModal
          selectedAgents={selectedAgents}
          allAgentsSelected={allAgentsSelected}
          filters={filters}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsUpgradeAgentsVisible(false);
          }}
          setIsUpgradePanelClosed={setIsUpgradePanelClosed}
        />
      ) : null}
      {isRemoveAgentsModalVisible && (
        <RemoveAgentsModal
          selectedAgents={selectedAgents}
          allAgentsSelected={allAgentsSelected}
          filters={filters}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsRemoveAgentsModalVisible(false);
          }}
        />
      )}
    </>
  );
};
