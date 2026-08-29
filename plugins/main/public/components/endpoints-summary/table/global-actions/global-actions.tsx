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
import { endpointsSummaryI18n } from '../../i18n';

export interface AgentsTableGlobalActionsProps {
  selectedAgents: Agent[];
  allAgentsSelected: boolean;
  allAgentsCount: number;
  filters: unknown;
  reloadAgents: () => void;
}

export const AgentsTableGlobalActions = ({
  selectedAgents,
  allAgentsSelected,
  allAgentsCount,
  filters,
  reloadAgents,
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
      {endpointsSummaryI18n.more}
    </EuiButtonEmpty>
  );

  const totalAgents = allAgentsSelected
    ? allAgentsCount
    : selectedAgents.length;

  const selectAgentsTooltip = (content: React.ReactNode) => (
    <EuiToolTip content={endpointsSummaryI18n.selectAgentsToPerform}>
      <span>{content}</span>
    </EuiToolTip>
  );

  const actions = {
    addGroups: endpointsSummaryI18n.addGroupsToAgents,
    removeGroups: endpointsSummaryI18n.removeGroupsFromAgents,
    upgrade: endpointsSummaryI18n.upgradeAgents,
    remove: endpointsSummaryI18n.removeAgents,
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
            disabled={!totalAgents}
            onClick={() => {
              setAddOrRemoveGroups('add');
              closePopover();
              setIsEditGroupsVisible(true);
            }}
          >
            {!totalAgents ? (
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
            disabled={!totalAgents}
            onClick={() => {
              setAddOrRemoveGroups('remove');
              closePopover();
              setIsEditGroupsVisible(true);
            }}
          >
            {!totalAgents ? (
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
