import React from 'react';
import { EuiPage, EuiPageBody, EuiPageSideBar } from '@elastic/eui';
import { FleetSideMenu } from './side-menu';

export interface FleetManagementProps {
  activeOption: string;
  content: React.ReactNode;
}

export const FleetManagement = ({
  activeOption,
  content,
}: FleetManagementProps) => {
  return (
    <EuiPage>
      <EuiPageSideBar>
        <FleetSideMenu selectedItem={activeOption} />
      </EuiPageSideBar>
      <EuiPageBody>{content}</EuiPageBody>
    </EuiPage>
  );
};
