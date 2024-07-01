import React from 'react';
import { EuiPage, EuiPageBody, EuiPageSideBar } from '@elastic/eui';
import { FleetSideMenu } from './side-menu';
import { AgentList } from './agents';
import { GroupList } from './groups';
import { withErrorBoundary, withGlobalBreadcrumb } from '../common/hocs';
import { fleetManagement } from '../../utils/applications';
import { compose } from 'redux';
import { FLEET_MANAGEMENT_OPTIONS } from './constants';

export interface FleetManagementProps {
  activeOption: string;
}

export const FleetManagement = compose(
  withErrorBoundary,
  withGlobalBreadcrumb(({ activeOption }) => [
    { text: fleetManagement.breadcrumbLabel },
    {
      text: FLEET_MANAGEMENT_OPTIONS.find(option => option.id === activeOption)
        ?.name,
    },
  ]),
)(({ activeOption }: FleetManagementProps) => {
  return (
    <EuiPage>
      <EuiPageSideBar>
        <FleetSideMenu selectedItem={activeOption} />
      </EuiPageSideBar>
      <EuiPageBody>
        {activeOption === 'agents' && <AgentList />}
        {activeOption === 'groups' && <GroupList />}
      </EuiPageBody>
    </EuiPage>
  );
});
