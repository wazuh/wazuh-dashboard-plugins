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
import { TableIndexer } from '../../common/table-indexer/table-indexer';
import { groupsTableColumns } from './columns';

export interface IGroupListProps {
  indexPatterns: any;
  filters: any[];
}

export const GroupList = (props: IGroupListProps) => {
  const { indexPatterns, filters } = props;
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
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
      />
      <EuiSpacer />
      <TableIndexer
        indexPatterns={indexPatterns}
        tableSortingInitialField='name'
        tableSortingInitialDirection='asc'
        columns={groupsTableColumns({
          setIsFlyoutVisible: setIsFlyoutVisible,
          setGroup,
        })}
        filters={filters}
        tableProps={{
          hasActions: true,
        }}
      />
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
