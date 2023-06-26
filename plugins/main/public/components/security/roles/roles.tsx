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
    const roles_request = await WzRequest.apiReq('GET', '/security/roles', {});
    const roles =
      (((roles_request || {}).data || {}).data || {}).affected_items || [];
    setRoles(roles);
    const policies_request = await WzRequest.apiReq(
      'GET',
      '/security/policies',
      {},
    );
    const policiesData =
      (((policies_request || {}).data || {}).data || {}).affected_items || [];
    setPoliciesData(policiesData);
    setLoadingTable(false);
  }

  useEffect(() => {
    getData();
  }, []);

  let flyout;
  if (isFlyoutVisible) {
    flyout = (
      <CreateRole
        closeFlyout={async isVisible => {
          setIsFlyoutVisible(isVisible);
          await getData();
        }}
      />
    );
  }

  const editRole = item => {
    setEditingRole(item);
    setIsEditFlyoutVisible(true);
  };

  let editFlyout;
  if (isEditFlyoutVisible) {
    editFlyout = (
      <EditRole
        role={editingRole}
        closeFlyout={async isVisible => {
          setIsEditFlyoutVisible(isVisible);
          await getData();
        }}
      />
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
