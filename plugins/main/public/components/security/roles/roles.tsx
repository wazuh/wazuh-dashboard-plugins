import React, { useState, useEffect, useCallback } from 'react';
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
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  async function getData(pageIndex = 0, pageSize = 10) {
    setLoadingTable(true);
    try {
      const offset = pageIndex * pageSize;
      const rolesRequest = await WzRequest.apiReq('GET', '/security/roles', {
        params: {
          offset,
          limit: pageSize,
        },
      });
      const roles = rolesRequest?.data?.data?.affected_items || [];
      const total = rolesRequest?.data?.data?.total_affected_items || 0;
      setRoles(roles);
      setTotalItems(total);
      setPageIndex(pageIndex);
      setPageSize(pageSize);

      // Only fetch policies that are actually used by the roles in this page
      const policyIds = [
        ...new Set(roles.flatMap(role => role.policies || [])),
      ];
      if (policyIds.length > 0) {
        const policiesRequest = await WzRequest.apiReq(
          'GET',
          '/security/policies',
          {
            params: {
              policy_ids: policyIds.join(','),
            },
          },
        );
        const policiesData = policiesRequest?.data?.data?.affected_items || [];
        setPoliciesData(policiesData);
      } else {
        setPoliciesData([]);
      }
    } finally {
      setLoadingTable(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  const refreshCurrentPage = useCallback(() => {
    return getData(pageIndex, pageSize);
  }, [pageIndex, pageSize]);

  const closeEditingFlyout = useCallback(
    needRefresh => {
      if (needRefresh) {
        refreshCurrentPage();
      }
      setIsEditFlyoutVisible(false);
    },
    [refreshCurrentPage],
  );

  const closeCreatingFlyout = useCallback(
    needRefresh => {
      if (needRefresh) {
        refreshCurrentPage();
      }
      setIsFlyoutVisible(false);
    },
    [refreshCurrentPage],
  );

  let flyout;
  if (isFlyoutVisible) {
    flyout = <CreateRole closeFlyout={closeCreatingFlyout} />;
  }

  const editRole = item => {
    setEditingRole(item);
    setIsEditFlyoutVisible(true);
  };

  const handleTableChange = ({ page }) => {
    if (page) {
      // If pageSize changed, reset to first page
      const newPageIndex = page.size !== pageSize ? 0 : page.index;
      getData(newPageIndex, page.size);
    }
  };

  let editFlyout;
  if (isEditFlyoutVisible) {
    editFlyout = (
      <EditRole
        role={editingRole}
        closeFlyout={closeEditingFlyout}
        onRoleUpdated={refreshCurrentPage}
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
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalItems={totalItems}
          onTableChange={handleTableChange}
        ></RolesTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
});
