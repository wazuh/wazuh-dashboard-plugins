import React, { useState, useEffect } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiButton,
  EuiTitle,
} from '@elastic/eui';
import { PoliciesTable } from './policies-table';
import { usePagination } from '../../common/hooks/usePagination';
import GetPoliciesService from './services/get-policies.service';
import { EditPolicyFlyout } from './edit-policy';
import { CreatePolicyFlyout } from './create-policy';
import { withUserAuthorizationPrompt } from '../../common/hocs';
import { WzButtonPermissions } from '../../common/permissions/button';

export const Policies = withUserAuthorizationPrompt([
  { action: 'security:read', resource: 'policy:id:*' },
])(() => {
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState('');

  const {
    items: policies,
    loading,
    pageIndex,
    pageSize,
    totalItems,
    getData,
    refreshCurrentPage,
    onTableChange: handleTableChange,
  } = usePagination(GetPoliciesService);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editPolicy = item => {
    setEditingPolicy(item);
    setIsEditingPolicy(true);
  };

  const closeEditingFlyout = needRefresh => {
    if (needRefresh) {
      refreshCurrentPage();
    }
    setIsEditingPolicy(false);
  };

  const closeCreatingFlyout = needRefresh => {
    if (needRefresh) {
      refreshCurrentPage();
    }
    setIsCreatingPolicy(false);
  };

  let editFlyout;
  if (isEditingPolicy) {
    editFlyout = (
      <EditPolicyFlyout
        closeFlyout={closeEditingFlyout}
        policy={editingPolicy}
      />
    );
  }
  let flyout;
  if (isCreatingPolicy) {
    flyout = <CreatePolicyFlyout closeFlyout={closeCreatingFlyout} />;
  }

  return (
    <EuiPageContent>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
            <h2>Policies</h2>
          </EuiTitle>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          {!loading && (
            <div>
              <WzButtonPermissions
                buttonType='default'
                permissions={[{ action: 'security:create', resource: '*:*:*' }]}
                onClick={() => setIsCreatingPolicy(true)}
              >
                Create policy
              </WzButtonPermissions>
              {flyout}
              {editFlyout}
            </div>
          )}
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        <PoliciesTable
          loading={loading}
          policies={policies}
          editPolicy={editPolicy}
          updatePolicies={refreshCurrentPage}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalItems={totalItems}
          onTableChange={handleTableChange}
        ></PoliciesTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
});
