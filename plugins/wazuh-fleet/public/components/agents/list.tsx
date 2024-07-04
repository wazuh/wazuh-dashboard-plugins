import React, { useState } from 'react';
import {
  EuiPageHeader,
  EuiSpacer,
  EuiButton,
  EuiPopover,
  EuiContextMenuPanel,
  EuiContextMenuItem,
} from '@elastic/eui';
import { agentsTableColumns } from './columns';
import { AgentsVisualizations } from './visualizations';

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
  const [isActionsOpen, setIsActionsOpen] = useState(false)

  const closeActions = () => {
    // setIsActionsOpen(false)
  };

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
              // onClick={() => setIsActionsOpen(!isActionsOpen)}
              >
                Actions
              </EuiButton>
            }
            isOpen={false}
            closePopover={closeActions}
            panelPaddingSize='none'
            anchorPosition='downLeft'
          >
            <EuiContextMenuPanel
              items={[
                <EuiContextMenuItem
                  key='copy'
                  icon='copy'
                  onClick={closeActions}
                >
                  Copy
                </EuiContextMenuItem>,
                <EuiContextMenuItem
                  key='edit'
                  icon='pencil'
                  onClick={closeActions}
                >
                  Edit
                </EuiContextMenuItem>,
                <EuiContextMenuItem
                  key='share'
                  icon='share'
                  onClick={closeActions}
                >
                  Share
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
        columns={agentsTableColumns()}
        tableSortingInitialField='agent.id'
        tableSortingInitialDirection='asc'
        topTableComponent={<AgentsVisualizations />}
      />
    </>
  );
};
