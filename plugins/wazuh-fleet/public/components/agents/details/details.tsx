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
  EuiContextMenu,
  EuiIcon,
} from '@elastic/eui';
import { Agent } from '../../../../common/types';
import { AgentResume } from './resume';
import { AgentDashboard } from './dashboard';
import { AgentInventory } from './inventory';
import { AgentConfiguration } from './configuration';

export interface AgentDetailsProps {
  useDataSource: any;
  FleetDataSource: any;
  FleetDataSourceRepository: any;
}

export const AgentDetails = ({
  FleetDataSource,
  FleetDataSourceRepository,
  ...restProps
}: AgentDetailsProps) => {
  const { id } = useParams();

  const {
    dataSource,
    isLoading: isDataSourceLoading,
    fetchData,
    filterManager,
    fetchFilters,
  } = restProps.useDataSource({
    DataSource: FleetDataSource,
    repository: new FleetDataSourceRepository(),
  });

  const [isAgentLoading, setIsAgentLoading] = useState(true);
  const [agentData, setAgentData] = useState<Agent>();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isNavigateToOpen, setIsNavigateToOpen] = useState(false);

  useEffect(() => {
    if (!filterManager || isDataSourceLoading) return;

    const filterByAgentId = filterManager.createFilter(
      'is',
      'agent.id',
      id,
      dataSource?.indexPattern.id,
    );

    fetchData({
      filters: [filterByAgentId, ...fetchFilters],
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

  const closeNativagateTo = () => {
    setIsNavigateToOpen(false);
  };

  const closeActions = () => {
    setIsActionsOpen(false);
  };

  const navigateToPanels = [
    {
      id: 0,
      items: [
        {
          name: 'Endpoint security',
          icon: 'monitoringApp',
          panel: 1,
        },
        {
          name: 'Threat intelligencey',
          icon: 'lensApp',
          panel: 2,
        },
      ],
    },
    {
      id: 1,
      initialFocusedItemIndex: 1,
      title: 'Endpoint security',
      items: [
        {
          name: 'Configuration Assessment',
          onClick: () => {
            closeNativagateTo();
          },
        },
        {
          name: 'Malware Detection',
          onClick: () => {
            closeNativagateTo();
          },
        },
        {
          name: 'File Integrity Monitoring',
          onClick: () => {
            closeNativagateTo();
          },
        },
      ],
    },
    {
      id: 2,
      initialFocusedItemIndex: 1,
      title: 'Threat intelligencey',
      items: [
        {
          name: 'Threat Hunting',
          onClick: () => {
            closeNativagateTo();
          },
        },
        {
          name: 'Vulnerability Detection',
          onClick: () => {
            closeNativagateTo();
          },
        },
        {
          name: 'MITRE ATT&CT',
          onClick: () => {
            closeNativagateTo();
          },
        },
        {
          name: 'VirusTotal',
          onClick: () => {
            closeNativagateTo();
          },
        },
      ],
    },
  ];

  const tabContent = (content: React.ReactNode) => (
    <>
      <EuiSpacer />
      {content}
    </>
  );

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      content: tabContent(<AgentDashboard agentId={id} {...restProps} />),
    },
    {
      id: 'inventory',
      name: 'Inventory',
      content: tabContent(<AgentInventory agentId={id} />),
    },
    {
      id: 'configuration',
      name: 'Configuration',
      content: tabContent(<AgentConfiguration agentId={id} />),
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
          <EuiPopover
            id='navigate-to'
            button={
              <EuiButton
                iconType='arrowDown'
                iconSide='right'
                onClick={() => setIsNavigateToOpen(!isNavigateToOpen)}
              >
                Navigate to
              </EuiButton>
            }
            isOpen={isNavigateToOpen}
            closePopover={closeNativagateTo}
            panelPaddingSize='none'
            anchorPosition='downLeft'
            panelStyle={{ overflowY: 'unset' }}
          >
            <EuiContextMenu initialPanelId={0} panels={navigateToPanels} />
          </EuiPopover>,
        ]}
      />
      <EuiSpacer />
      <AgentResume agent={agentData} />
      <EuiSpacer />
      <EuiTabbedContent
        tabs={tabs}
        initialSelectedTab={tabs[0]}
        autoFocus='selected'
      />
    </>
  );
};
