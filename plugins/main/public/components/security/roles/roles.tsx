import React, { useState, useEffect } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiTitle,
} from '@elastic/eui';
import { RolesTable } from './roles-table';
import { WzRequest } from '../../../react-services/wz-request';
import { CreateRole } from './create-role';
import { EditRole } from './edit-role';
import { withUserAuthorizationPrompt } from '../../common/hocs';
import { WzButtonPermissions } from '../../common/permissions/button';
import { closeFlyout } from '../../common/flyouts/close-flyout-security';

export const Roles = withUserAuthorizationPrompt([
  { action: 'security:read', resource: 'role:id:*' },
  { action: 'security:read', resource: 'policy:id:*' },
])(() => {
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [isEditFlyoutVisible, setIsEditFlyoutVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [roles, setRoles] = useState([]);
  const [policiesData, setPoliciesData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  async function getData() {
    setLoadingTable(true);
    const rolesRequest = await WzRequest.apiReq('GET', '/security/roles', {});
    const roles = rolesRequest?.data?.data?.affected_items || [];
    setRoles(roles);
    const policiesRequest = await WzRequest.apiReq(
      'GET',
      '/security/policies',
      {},
    );
    const policiesData = policiesRequest?.data?.data?.affected_items || [];
    setPoliciesData(policiesData);
    setLoadingTable(false);
  }

  useEffect(() => {
    getData();
  }, []);

  const closeEditingFlyout = needRefresh => {
    closeFlyout(needRefresh, setIsEditFlyoutVisible, getData);
  };

  const closeCreatingFlyout = needRefresh => {
    closeFlyout(needRefresh, setIsFlyoutVisible, getData);
  };

  let flyout;
  if (isFlyoutVisible) {
    flyout = <CreateRole closeFlyout={closeCreatingFlyout} />;
  }

  const editRole = item => {
    setEditingRole(item);
    setIsEditFlyoutVisible(true);
  };

  let editFlyout;
  if (isEditFlyoutVisible) {
    editFlyout = (
      <EditRole role={editingRole} closeFlyout={closeEditingFlyout} />
    );
  }

  return (
    <EuiPageContent>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
            <h2>Roles</h2>
          </EuiTitle>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          {!loadingTable && (
            <div>
              <WzButtonPermissions
                buttonType='default'
                permissions={[{ action: 'security:create', resource: '*:*:*' }]}
                onClick={() => setIsFlyoutVisible(true)}
              >
                Create role
              </WzButtonPermissions>
              {flyout}
              {editFlyout}
            </div>
          )}
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        <RolesTable
          loading={loadingTable}
          roles={roles}
          policiesData={policiesData}
          editRole={editRole}
          updateRoles={getData}
        ></RolesTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
});
