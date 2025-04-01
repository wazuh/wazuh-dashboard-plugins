import React, { createContext, useState, useContext } from 'react';
import {
  EuiCheckbox,
  EuiPopover,
  EuiButtonIcon,
  EuiPopoverTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiDataGridControlColumn,
} from '@elastic/eui';
import { IAgentResponse } from '../../../../../common/types';
import { getWazuhCore } from '../../../../plugin-services';

export interface AgentsTableGlobalActionsProps {
  setIsFlyoutAgentVisible: (visible: boolean) => void;
  setIsDeleteModalVisible: (visible: boolean) => void;
  setIsEditGroupsVisible: (visible: boolean) => void;
  setIsUpgradeModalVisible: (visible: boolean) => void;
  setIsEditNameVisible: (visible: boolean) => void;
  setAgent: (agent: IAgentResponse) => void;
}

const SelectionContext = createContext([
  new Set<number>(),
  (_action: { action: string; rowIndex?: number }) => {},
] as [Set<number>, (action: { action: string; rowIndex?: number }) => void]);

const SelectionHeaderCell = () => {
  const [selectedRows, updateSelectedRows] = useContext(SelectionContext);
  // const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length;
  const isIndeterminate = false;

  return (
    <EuiCheckbox
      id='selection-toggle'
      aria-label='Select all rows'
      indeterminate={isIndeterminate}
      checked={selectedRows.size > 0}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
        if (isIndeterminate) {
          // clear selection
          updateSelectedRows({ action: 'clear' });
        } else {
          if (event.target.checked) {
            // select everything
            updateSelectedRows({ action: 'selectAll' });
          } else {
            // clear selection
            updateSelectedRows({ action: 'clear' });
          }
        }
      }}
    />
  );
};

const SelectionRowCell = ({ rowIndex }) => {
  const [selectedRows, setSelectedRows] = useContext(SelectionContext);
  const isChecked = selectedRows.has(rowIndex);

  const updateSelectedRows = (action: 'add' | 'delete', rowIndex: number) => {
    setSelectedRows(prevSelectedRows => {
      const updatedRows = new Set(prevSelectedRows);

      if (action === 'add') {
        updatedRows.add(rowIndex);
      } else if (action === 'delete') {
        updatedRows.delete(rowIndex);
      }

      return updatedRows;
    });
  };

  return (
    <div>
      <EuiCheckbox
        id={`${rowIndex}`}
        aria-label={`Select row ${rowIndex}`}
        checked={isChecked}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          if (event.target.checked) {
            updateSelectedRows('add', rowIndex);
          } else {
            updateSelectedRows('delete', rowIndex);
          }
        }}
      />
    </div>
  );
};

const actionsButtons = ({
  setIsFlyoutAgentVisible,
  setAgent,
  setIsDeleteModalVisible,
  setIsEditGroupsVisible,
  setIsUpgradeModalVisible,
  setIsEditNameVisible,
}: AgentsTableGlobalActionsProps) => [
  {
    name: 'View agent tasks',
    description: 'View agent tasks',
    icon: 'storage',
    type: 'icon',
    onClick: (agent: IAgentResponse) => {
      // TODO: Change this url to the url of the command view with a pinned agent
      getWazuhCore()
        .navigationService.getInstance()
        .navigate(`/agents/${agent.agent.id}`);
    },
  },
  {
    name: 'View agent details',
    description: 'View agent details',
    icon: 'eye',
    type: 'icon',
    isPrimary: true,
    color: 'primary',
    onClick: (agent: IAgentResponse) => {
      setAgent(agent);
      setIsFlyoutAgentVisible(true);
    },
    // enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    // onClick: agent =>
    // NavigationService.getInstance().navigateToApp(endpointSummary.id, {
    //   path: `#/agents?tab=welcome&agent=${agent.id}`,
    // }),
  },
  {
    name: 'Delete agent',
    description: 'Delete agent',
    icon: 'trash',
    type: 'icon',
    isPrimary: true,
    color: 'danger',
    onClick: (agent: IAgentResponse) => {
      setAgent(agent);
      setIsDeleteModalVisible(true);
    },
  },
  {
    name: 'Edit name',
    description: 'Edit name',
    icon: 'pencil',
    type: 'icon',
    onClick: (agent: IAgentResponse) => {
      setAgent(agent);
      setIsEditNameVisible(true);
    },
    // enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    // 'data-test-subj': 'action-configuration',
  },
  {
    name: 'Edit groups',
    description: 'Edit groups',
    icon: 'pencil',
    type: 'icon',
    onClick: (agent: IAgentResponse) => {
      setAgent(agent);
      setIsEditGroupsVisible(true);
    },
    'data-test-subj': 'action-groups',
    // enabled: () => allowEditGroups,
  },
  {
    name: 'Upgrade',
    description: 'Upgrade',
    icon: 'package',
    type: 'icon',
    onClick: (agent: IAgentResponse) => {
      setAgent(agent);
      setIsUpgradeModalVisible(true);
    },
    'data-test-subj': 'action-upgrade',
    // enabled: agent => {
    //   const isOutdated = !!outdatedAgents.find(
    //     outdatedAgent => outdatedAgent.id === agent.id,
    //   );
    //   return (
    //     allowUpgrade &&
    //     agent.status === API_NAME_AGENT_STATUS.ACTIVE &&
    //     isOutdated
    //   );
    // },
  },
];

export const agentsTableSelection: EuiDataGridControlColumn[] = [
  {
    id: 'selection',
    width: 32,
    headerCellRender: SelectionHeaderCell,
    rowCellRender: SelectionRowCell,
  },
];

export const agentsTableActions = ({
  setIsFlyoutAgentVisible,
  setAgent,
  setIsDeleteModalVisible,
  setIsEditGroupsVisible,
  setIsUpgradeModalVisible,
  setIsEditNameVisible,
}: AgentsTableGlobalActionsProps): EuiDataGridControlColumn[] => [
  {
    id: 'actions',
    width: 40,
    headerCellRender: () => null,
    rowCellRender: function RowCellRender() {
      const [isPopoverOpen, setIsPopoverOpen] = useState(false);

      return (
        <div>
          <EuiPopover
            isOpen={isPopoverOpen}
            anchorPosition='upCenter'
            panelPaddingSize='s'
            button={
              <EuiButtonIcon
                aria-label='show actions'
                iconType='boxesHorizontal'
                color='text'
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              />
            }
            closePopover={() => setIsPopoverOpen(false)}
          >
            <EuiPopoverTitle>Actions</EuiPopoverTitle>
            <div style={{ width: 150 }}>
              {actionsButtons({
                setIsFlyoutAgentVisible,
                setAgent,
                setIsDeleteModalVisible,
                setIsEditGroupsVisible,
                setIsUpgradeModalVisible,
                setIsEditNameVisible,
              }).map((action, index) => (
                <EuiFlexGroup key={index} gutterSize='s'>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon
                      iconType={action.icon}
                      aria-label={action.description}
                      onClick={() => {
                        action?.onClick(action?.agent);
                        setIsPopoverOpen(false);
                      }}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>{action.description}</EuiFlexItem>
                </EuiFlexGroup>
              ))}
            </div>
          </EuiPopover>
        </div>
      );
    },
  },
];
// allowEditGroups: boolean,
// allowUpgrade: boolean,
// setIsUpgradeModalVisible: (visible: boolean) => void,
// outdatedAgents: Agent[],
