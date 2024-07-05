import React, { useState } from 'react';
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
import { agentsTableColumns } from './columns';
import { AgentsVisualizations } from './visualizations';
import { Agent } from '../../../../common/types';
import { AgentResume } from '../details/resume';
import { getCore } from '../../../plugin-services';

export interface AgentListProps {
  FleetDataSource: any;
  FleetDataSourceRepository: any;
  TableIndexer: any;
}

export const AgentList = ({
  FleetDataSource,
  FleetDataSourceRepository,
  TableIndexer,
}: AgentListProps) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [agent, setAgent] = useState<Agent>();

  const closeActions = () => {
    setIsActionsOpen(false);
  };

  const handleOnOpenAgentDetails = (agentId: string) => {};

  return (
    <>
      <EuiPageHeader
        pageTitle='Agents'
        rightSideItems={[
          <EuiButton fill iconType='plusInCircle'>
            Deploy new agent
          </EuiButton>,
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
                  Add groups to agents
                </EuiContextMenuItem>,
                <EuiContextMenuItem
                  key='remove-groups'
                  icon='trash'
                  onClick={closeActions}
                >
                  Remove groups from agents
                </EuiContextMenuItem>,
                <EuiHorizontalRule margin='xs' />,
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
        // rightSideGroupProps={{ gutterSize: 's' }}
      />
      <EuiSpacer size='l' />
      <TableIndexer
        DataSource={FleetDataSource}
        DataSourceRepository={FleetDataSourceRepository}
        columns={agentsTableColumns({
          onOpenAgentDetails: handleOnOpenAgentDetails,
          setIsFlyoutAgentVisible: setIsFlyoutVisible,
          setAgent,
        })}
        tableSortingInitialField='agent.last_login'
        tableSortingInitialDirection='desc'
        topTableComponent={<AgentsVisualizations />}
        tableProps={{
          hasActions: true,
          isSelectable: true,
          selection: {
            onSelectionChange: () => {},
          },
        }}
      />
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
