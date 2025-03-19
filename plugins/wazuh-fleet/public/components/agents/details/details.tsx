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
  // EuiTabbedContent,
  EuiLoadingContent,
  EuiContextMenu,
} from '@elastic/eui';
import { IAgentResponse } from '../../../../common/types';
import { getAgentManagement } from '../../../plugin-services';
import {
  Filter,
  IndexPattern,
} from '../../../../../../src/plugins/data/common';
import { AgentResume } from './resume';
// import { AgentDashboard } from './dashboard';
// import { AgentNetworks } from './networks';

export interface AgentDetailsProps {
  indexPatterns: IndexPattern;
  filters: Filter[];
}

export const AgentDetails = ({
  indexPatterns,
  // filters,
  // ...restProps
}: AgentDetailsProps) => {
  const { id } = useParams();
  const [isAgentLoading, setIsAgentLoading] = useState(true);
  const [agentData, setAgentData] = useState<IAgentResponse>();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isNavigateToOpen, setIsNavigateToOpen] = useState(false);

  useEffect(() => {
    if (!indexPatterns) {
      return;
    }

    getAgentManagement()
      .getByAgentId(id)
      .then((results: any) => {
        setAgentData(results);
        setIsAgentLoading(false);
      })
      .catch((error: any) => {
        console.log(error);
      });
  }, [id]);

  if (isAgentLoading) {
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
  // TODO: Add tabs for each section of the agent details page when we have them implemented
  // const tabContent = (content: React.ReactNode) => (
  //   <>
  //     <EuiSpacer />
  //     {content}
  //   </>
  // );
  // const tabs = [
  //   {
  //     id: 'dashboard',
  //     name: 'Dashboard',
  //     content: tabContent(
  //       <AgentDashboard
  //         indexPattern={indexPatterns}
  //         agentId={id}
  //         filters={filters}
  //         {...restProps}
  //       />,
  //     ),
  //   },
  //   {
  //     id: 'networks',
  //     name: 'Networks',
  //     content: tabContent(<AgentNetworks agentId={id} />),
  //   },
  //   {
  //     id: 'processes',
  //     name: 'Processes',
  //     content: tabContent(<div>Processes</div>),
  //   },
  //   {
  //     id: 'packages',
  //     name: 'Packages',
  //     content: tabContent(<div>Packages</div>),
  //   },
  //   {
  //     id: 'configuration',
  //     name: 'Configuration',
  //     content: tabContent(<div>Configuration</div>),
  //   },
  // ];
  const renderViewAgent = (
    <>
      <EuiPageHeader
        pageTitle={agentData?._source.agent?.name}
        rightSideItems={[
          <EuiPopover
            key={'actions'}
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
                <EuiHorizontalRule key='space' margin='xs' />,
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
            key={'navigate-to'}
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
      {agentData !== null && <AgentResume agent={agentData} />}
      <EuiSpacer />

      {/*
      TODO: Add tabs for each section of the agent details page when we have them implemented
      <EuiTabbedContent
        tabs={tabs}
        initialSelectedTab={tabs[0]}
        autoFocus='selected'
      /> */}
    </>
  );
  const renderNoAgent = <EuiPageHeader pageTitle={'Agent not found'} />;

  return agentData === null ? renderNoAgent : renderViewAgent;
};
