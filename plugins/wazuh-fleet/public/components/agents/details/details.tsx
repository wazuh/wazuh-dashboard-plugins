import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  EuiPageHeader,
  EuiSpacer,
  EuiButton,
  EuiPopover,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiHorizontalRule,
  EuiTabbedContent,
  EuiLoadingContent,
} from '@elastic/eui';
import { Agent } from '../../../../common/types';
import { AgentResume } from './resume';

export interface AgentDetailsProps {
  useDataSource: any;
  FleetDataSource: any;
  FleetDataSourceRepository: any;
}

export const AgentDetails = ({
  useDataSource,
  FleetDataSource,
  FleetDataSourceRepository,
}: AgentDetailsProps) => {
  const { id } = useParams();

  const {
    dataSource,
    isLoading: isDataSourceLoading,
    fetchData,
    filterManager,
  } = useDataSource({
    DataSource: FleetDataSource,
    repository: new FleetDataSourceRepository(),
  });

  const [isAgentLoading, setIsAgentLoading] = useState(true);
  const [agentData, setAgentData] = useState<Agent>();
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  useEffect(() => {
    if (!filterManager || isDataSourceLoading) return;

    const filterByAgentId = filterManager.createFilter(
      'is',
      'agent.id',
      id,
      dataSource?.indexPattern.id,
    );

    fetchData({
      query: filterByAgentId.query,
    })
      .then((results: any) => {
        setAgentData(results.hits.hits?.[0]?._source);
        setIsAgentLoading(false);
      })
      .catch((error: any) => {
        console.log(error);
      });
  }, [filterManager, isDataSourceLoading]);

  if (isDataSourceLoading || isAgentLoading) {
    return (
      <div>
        <EuiLoadingContent lines={3} />
      </div>
    );
  }

  const closeActions = () => {
    setIsActionsOpen(false);
  };

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      content: <div>Dashboard</div>,
    },
    {
      id: 'inventory',
      name: 'Inventory',
      content: <div>Inventory</div>,
    },
    {
      id: 'configuration',
      name: 'Configuration',
      content: <div>Configuration</div>,
    },
  ];

  return (
    <>
      <EuiPageHeader
        pageTitle={agentData?.agent?.name}
        rightSideItems={[
          <EuiPopover
            id='actions'
            button={
              <EuiButton
                iconType='arrowDown'
                iconSide='right'
                onClick={() => setIsActionsOpen(!isActionsOpen)}
              >
                Actions
              </EuiButton>
            }
            isOpen={isActionsOpen}
            closePopover={closeActions}
            panelPaddingSize='none'
            anchorPosition='downLeft'
            panelStyle={{ overflowY: 'unset' }}
          >
            <EuiContextMenuPanel
              items={[
                <EuiContextMenuItem
                  key='add-groups'
                  icon='plusInCircle'
                  onClick={closeActions}
                >
                  Add groups to agent
                </EuiContextMenuItem>,
                <EuiContextMenuItem
                  key='remove-groups'
                  icon='trash'
                  onClick={closeActions}
                >
                  Remove groups from agent
                </EuiContextMenuItem>,
                <EuiHorizontalRule margin='xs' />,
                <EuiContextMenuItem
                  key='upgrade-agents'
                  icon='package'
                  onClick={closeActions}
                >
                  Upgrade agent
                </EuiContextMenuItem>,
                <EuiContextMenuItem
                  key='upgrade-tasks'
                  icon='eye'
                  onClick={closeActions}
                >
                  Upgrade tasks details
                </EuiContextMenuItem>,
              ]}
            />
          </EuiPopover>,
        ]}
      />
      <EuiSpacer size='l' />
      <AgentResume agent={agentData} />
      <EuiSpacer size='l' />
      <EuiTabbedContent
        tabs={tabs}
        initialSelectedTab={tabs[0]}
        autoFocus='selected'
        onTabClick={tab => {}}
      />
    </>
  );
};
