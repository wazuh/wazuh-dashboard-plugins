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
import { usePagination } from '../../common/hooks/usePagination';
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
  const [policiesData, setPoliciesData] = useState([]);

  const fetchRoles = useCallback(async (offset, limit, sort) => {
    const rolesRequest = await WzRequest.apiReq('GET', '/security/roles', {
      params: {
        offset,
        limit,
        ...(sort ? { sort } : {}),
      },
    });
    const roles = rolesRequest?.data?.data?.affected_items || [];
    const total = rolesRequest?.data?.data?.total_affected_items || 0;

    // Only fetch policies that are actually used by the roles in this page
    const policyIds = [...new Set(roles.flatMap(role => role.policies || []))];
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
      setPoliciesData(policiesRequest?.data?.data?.affected_items || []);
    } else {
      setPoliciesData([]);
    }

    return { data: roles, total };
  }, []);

  const {
    items: roles,
    loading: loadingTable,
    pageIndex,
    pageSize,
    totalItems,
    getData,
    refreshCurrentPage,
    onTableChange: handleTableChange,
    sorting,
  } = usePagination(fetchRoles, undefined, { field: 'id', direction: 'asc' });

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          sorting={sorting}
        ></RolesTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
});
