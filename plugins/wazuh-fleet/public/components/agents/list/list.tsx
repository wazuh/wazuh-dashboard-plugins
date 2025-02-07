import React, { useEffect, useState } from 'react';
import {
  EuiPageHeader,
  EuiSpacer,
  EuiButton,
  EuiPopover,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiHorizontalRule,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiText,
  EuiTitle,
  EuiLink,
} from '@elastic/eui';
import { Agent } from '../../../../common/types';
import { AgentResume } from '../details/resume';
import { getCore, getPlugins } from '../../../plugin-services';
import NavigationService from '../../../react-services/navigation-service';
import { enrollmentAgent } from '../../common/views';
// import { agentsTableColumns } from './columns';
import { TableIndexer } from '../../common/table-indexer/table-indexer';
import { AgentsVisualizations } from './visualizations';

// export interface AgentListProps {
//   FleetDataSource: any;
//   FleetDataSourceRepository: any;
//   TableIndexer: any;
// }

export const AgentList = () => {
  const [indexPattern, setIndexPattern] = useState<object | undefined>();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [agent, setAgent] = useState<Agent>();

  const closeActions = () => {
    setIsActionsOpen(false);
  };

  const navigateToDeployNewAgent = () => {
    NavigationService.getInstance().navigate(enrollmentAgent.path);
  };

  useEffect(() => {
    getPlugins()
      .data.indexPatterns.get('wazuh-agents*')
      .then((indexPattern: any) => setIndexPattern(indexPattern));
  }, []);

  return (
    <>
      <EuiPageHeader
        pageTitle='Agents'
        rightSideItems={[
          <EuiButton
            key='add-agent'
            fill
            iconType='plusInCircle'
            onClick={() => navigateToDeployNewAgent()}
          >
            Deploy new agent
          </EuiButton>,
          <EuiPopover
            key='actions'
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
                  Add groups to agents
                </EuiContextMenuItem>,
                <EuiContextMenuItem
                  key='remove-groups'
                  icon='trash'
                  onClick={closeActions}
                >
                  Remove groups from agents
                </EuiContextMenuItem>,
                <EuiHorizontalRule margin='xs' key='horizontalRule' />,
                <EuiContextMenuItem
                  key='upgrade-agents'
                  icon='package'
                  onClick={closeActions}
                >
                  Upgrade agents
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
      <EuiSpacer />
      <AgentsVisualizations />
      {indexPattern ? (
        <TableIndexer
          indexPatterns={[indexPattern]}

          // DataSource={FleetDataSource}
          // DataSourceRepository={FleetDataSourceRepository}
          // columns={agentsTableColumns({
          //   onOpenAgentDetails: handleOnOpenAgentDetails,
          //   setIsFlyoutAgentVisible: setIsFlyoutVisible,
          //   setAgent,
          // })}
          // tableSortingInitialField='agent.last_login'
          // tableSortingInitialDirection='desc'
          // topTableComponent={<AgentsVisualizations />}
          // tableProps={{
          //   hasActions: true,
          //   isSelectable: true,
          //   selection: {
          //     onSelectionChange: () => {},
          //   },
          // }}
        />
      ) : null}
      {isFlyoutVisible ? (
        <EuiFlyout
          ownFocus
          onClose={() => setIsFlyoutVisible(false)}
          aria-labelledby='flyout-agent'
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2>
                <EuiLink
                  href={getCore().application.getUrlForApp('fleet-management', {
                    path: `#/fleet-management/agents/${agent.agent.id}`,
                  })}
                  target='_blank'
                >
                  {agent.agent.name}
                </EuiLink>
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText>
              <AgentResume agent={agent} />
            </EuiText>
          </EuiFlyoutBody>
        </EuiFlyout>
      ) : null}
    </>
  );
};
