import React, { createContext, useContext } from 'react';
import { EuiCheckbox, EuiDataGridControlColumn } from '@elastic/eui';
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

export const actionsButtons = ({
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
    onClick: (_row, agent: IAgentResponse) => {
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
    onClick: (_row, agent: IAgentResponse) => {
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
    onClick: (_row, agent: IAgentResponse) => {
      setAgent(agent);
      setIsDeleteModalVisible(true);
    },
  },
  {
    name: 'Edit name',
    description: 'Edit name',
    icon: 'pencil',
    type: 'icon',
    onClick: (_row, agent: IAgentResponse) => {
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
    onClick: (_row, agent: IAgentResponse) => {
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
    onClick: (row, agent: IAgentResponse) => {
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
// allowEditGroups: boolean,
// allowUpgrade: boolean,
// setIsUpgradeModalVisible: (visible: boolean) => void,
// outdatedAgents: Agent[],
