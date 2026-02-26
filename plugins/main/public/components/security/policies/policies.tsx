import React, { useState, useEffect, useCallback } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiButton,
  EuiTitle,
} from '@elastic/eui';
import { PoliciesTable } from './policies-table';
import { WzRequest } from '../../../react-services/wz-request';
import { EditPolicyFlyout } from './edit-policy';
import { CreatePolicyFlyout } from './create-policy';
import { withUserAuthorizationPrompt } from '../../common/hocs';
import { WzButtonPermissions } from '../../common/permissions/button';

export const Policies = withUserAuthorizationPrompt([
  { action: 'security:read', resource: 'policy:id:*' },
])(() => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const getData = async (pageIndex = 0, pageSize = 10) => {
    setLoading(true);
    try {
      const offset = pageIndex * pageSize;
      const request = await WzRequest.apiReq('GET', '/security/policies', {
        params: {
          offset,
          limit: pageSize,
        },
      });
      const policies = request?.data?.data?.affected_items || [];
      const total = request?.data?.data?.total_affected_items || 0;
      setPolicies(policies);
      setTotalItems(total);
      setPageIndex(pageIndex);
      setPageSize(pageSize);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const refreshCurrentPage = useCallback(() => {
    return getData(pageIndex, pageSize);
  }, [pageIndex, pageSize]);

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

  const handleTableChange = ({ page }) => {
    if (page) {
      // If pageSize changed, reset to first page
      const newPageIndex = page.size !== pageSize ? 0 : page.index;
      getData(newPageIndex, page.size);
    }
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
