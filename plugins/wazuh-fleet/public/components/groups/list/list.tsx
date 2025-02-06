import React, { useState } from 'react';
import {
  EuiPageHeader,
  EuiSpacer,
  EuiButton,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiLink,
  EuiFlyoutBody,
  EuiText,
} from '@elastic/eui';
import { getCore } from '../../../plugin-services';
// import { columns } from './columns';

export interface AgentListProps {
  FleetGroupsDataSource: any;
  FleetGroupsDataSourceRepository: any;
  TableIndexer: any;
}

// export const GroupList = ({
//   FleetGroupsDataSource,
//   FleetGroupsDataSourceRepository,
//   TableIndexer,
// }: AgentListProps) => {
export const GroupList = () => {
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [group, setGroup] = useState();

  return (
    <>
      <EuiPageHeader
        pageTitle='Groups'
        rightSideItems={[
          <EuiButton key='addNewGroup' fill iconType='plusInCircle'>
            Add new group
          </EuiButton>,
        ]}
        // rightSideGroupProps={{ gutterSize: 's' }}
      />
      <EuiSpacer />
      {/* <TableIndexer
        DataSource={FleetGroupsDataSource}
        DataSourceRepository={FleetGroupsDataSourceRepository}
        tableSortingInitialField='name'
        tableSortingInitialDirection='asc'
        columns={columns({
          setIsFlyoutVisible: setIsFlyoutVisible,
          setGroup,
        })}
        tableProps={{
          hasActions: true,
        }}
      /> */}
      {isFlyoutVisible ? (
        <EuiFlyout
          ownFocus
          onClose={() => setIsFlyoutVisible(false)}
          aria-labelledby='flyout'
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2>
                <EuiLink
                  href={getCore().application.getUrlForApp('fleet-management', {
                    path: `#/fleet-management/groups/${group.id}`,
                  })}
                  target='_blank'
                >
                  {group.name}
                </EuiLink>
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText></EuiText>
          </EuiFlyoutBody>
        </EuiFlyout>
      ) : null}
    </>
  );
};
