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
import { WzRequest } from '../../../react-services/wz-request';
import { EditPolicyFlyout } from './edit-policy';
import { CreatePolicyFlyout } from './create-policy';
import { withUserAuthorizationPrompt } from '../../common/hocs';
import { WzButtonPermissions } from '../../common/permissions/button';
import { closeFlyout } from '../../common/flyouts/close-flyout-security';

export const Policies = withUserAuthorizationPrompt([
  { action: 'security:read', resource: 'policy:id:*' },
])(() => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState('');

  const getPolicies = async () => {
    setLoading(true);
    const request = await WzRequest.apiReq('GET', '/security/policies', {});
    const policies = request?.data?.data?.affected_items || [];
    setPolicies(policies);
    setLoading(false);
  };

  useEffect(() => {
    getPolicies();
  }, []);

  const editPolicy = item => {
    setEditingPolicy(item);
    setIsEditingPolicy(true);
  };

  const closeEditingFlyout = needRefresh => {
    closeFlyout(needRefresh, setIsEditingPolicy, getPolicies);
  };

  const closeCreatingFlyout = needRefresh => {
    closeFlyout(needRefresh, setIsCreatingPolicy, getPolicies);
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
          updatePolicies={getPolicies}
        ></PoliciesTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
});
