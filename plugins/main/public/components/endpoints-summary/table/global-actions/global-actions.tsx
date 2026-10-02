import React, { useState } from 'react';
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiHorizontalRule,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WzElementPermissions } from '../../../common/permissions/element';
import { Agent } from '../../types';
import { EditAgentsGroupsModal } from './edit-groups/edit-groups-modal';
import { UpgradeAgentsModal } from './upgrade/upgrade-modal';
import { RemoveAgentsModal } from './remove/remove-modal';
import { ScanVulnerabilitiesAgentsModal } from './scan-vulnerabilities/scan-vulnerabilities-modal';

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
  const [
    isScanVulnerabilitiesAgentsVisible,
    setIsScanVulnerabilitiesAgentsVisible,
  ] = useState(false);

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
      {i18n.translate('wazuh.endpointsSummary.globalActions.moreButton', {
        defaultMessage: 'More',
      })}
    </EuiButtonEmpty>
  );

  const totalAgents = allAgentsSelected
    ? allAgentsCount
    : selectedAgents.length;

  const selectAgentsTooltip = (content: React.ReactNode) => (
    <EuiToolTip
      content={i18n.translate(
        'wazuh.endpointsSummary.globalActions.selectAgentsTooltip',
        { defaultMessage: 'Select agents to perfom the action' },
      )}
    >
      <span>{content}</span>
    </EuiToolTip>
  );

  const actions = {
    addGroups: i18n.translate(
      'wazuh.endpointsSummary.globalActions.addGroups',
      {
        defaultMessage: 'Add groups to agents',
      },
    ),
    removeGroups: i18n.translate(
      'wazuh.endpointsSummary.globalActions.removeGroups',
      { defaultMessage: 'Remove groups from agents' },
    ),
    upgrade: i18n.translate('wazuh.endpointsSummary.globalActions.upgrade', {
      defaultMessage: 'Upgrade agents',
    }),
    scanVulnerabilities: i18n.translate(
      'wazuh.endpointsSummary.globalActions.scanVulnerabilities',
      { defaultMessage: 'Scan vulnerabilities of agents' },
    ),
    remove: i18n.translate('wazuh.endpointsSummary.globalActions.remove', {
      defaultMessage: 'Remove agents',
    }),
  };

  const actionsWithCount = {
    addGroups: i18n.translate(
      'wazuh.endpointsSummary.globalActions.addGroupsWithCount',
      {
        defaultMessage: 'Add groups to agents ({totalAgents})',
        values: { totalAgents },
      },
    ),
    removeGroups: i18n.translate(
      'wazuh.endpointsSummary.globalActions.removeGroupsWithCount',
      {
        defaultMessage: 'Remove groups from agents ({totalAgents})',
        values: { totalAgents },
      },
    ),
    upgrade: i18n.translate(
      'wazuh.endpointsSummary.globalActions.upgradeWithCount',
      {
        defaultMessage: 'Upgrade agents ({totalAgents})',
        values: { totalAgents },
      },
    ),
    scanVulnerabilities: i18n.translate(
      'wazuh.endpointsSummary.globalActions.scanVulnerabilitiesWithCount',
      {
        defaultMessage: 'Scan vulnerabilities of agents ({totalAgents})',
        values: { totalAgents },
      },
    ),
    remove: i18n.translate(
      'wazuh.endpointsSummary.globalActions.removeWithCount',
      {
        defaultMessage: 'Remove agents ({totalAgents})',
        values: { totalAgents },
      },
    ),
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
              <span>{actionsWithCount.addGroups}</span>
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
              <span>{actionsWithCount.removeGroups}</span>
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
              <span>{actionsWithCount.upgrade}</span>
            )}
          </EuiContextMenuItem>
          <EuiContextMenuItem
            icon='search'
            disabled={!totalAgents}
            onClick={() => {
              closePopover();
              setIsScanVulnerabilitiesAgentsVisible(true);
            }}
          >
            {!totalAgents ? (
              selectAgentsTooltip(actions.scanVulnerabilities)
            ) : (
              <span>{actionsWithCount.scanVulnerabilities}</span>
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
              <span>{actionsWithCount.remove}</span>
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
      {isScanVulnerabilitiesAgentsVisible ? (
        <ScanVulnerabilitiesAgentsModal
          selectedAgents={selectedAgents}
          allAgentsSelected={allAgentsSelected}
          filters={filters}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsScanVulnerabilitiesAgentsVisible(false);
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
