import React, { useState, useEffect } from 'react';
import {
    EuiButton,
    EuiTitle,
    EuiFlyout,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiForm,
    EuiFieldText,
    EuiFormRow,
    EuiSpacer,
    EuiFlexGroup,
    EuiFlexItem,
    EuiBadge,
    EuiComboBox,
    EuiOverlayMask,
    EuiConfirmModal
} from '@elastic/eui';

import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { EditRolesTable } from './edit-role-table';
import { WzOverlayMask } from '../../common/util'

const reservedRoles = ['administrator', 'readonly', 'users_admin', 'agents_readonly', 'agents_admin', 'cluster_readonly', 'cluster_admin'];


export const EditRole = ({ role, closeFlyout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState({});
  const [isReserved, setIsReserved] = useState(reservedRoles.includes(role.name));
  const [policies, setPolicies] = useState([]);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [selectedPoliciesError, setSelectedPoliciesError] = useState(false);
  const [assignedPolicies, setAssignedPolicies] = useState([]);
  const [initialSelectedPolicies] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  async function getData() {
    try {
      setIsLoading(true);
      const roleDataResponse = await WzRequest.apiReq('GET', '/security/roles', {
        params: {
          role_ids: role.id,
        },
      });
      const roleData = (((roleDataResponse.data || {}).data || {}).affected_items || [])[0];
      setCurrentRole(roleData);
      const policies_request = await WzRequest.apiReq('GET', '/security/policies', {});
      const selectedPoliciesCopy = [];
      const policies = (
        (((policies_request || {}).data || {}).data || {}).affected_items || []
      ).map((x) => {
        const currentPolicy = { label: x.name, id: x.id, roles: x.roles, policy: x.policy };
        if (roleData.policies.includes(x.id)) {
          selectedPoliciesCopy.push(currentPolicy);
          return false;
        } else {
          return currentPolicy;
        }
      });
      const filteredPolicies = policies.filter((item) => item !== false);
      setAssignedPolicies(selectedPoliciesCopy);
      setPolicies(filteredPolicies);
    } catch (error) {
      ErrorHandler.handle(error, 'Error');
    }
    setIsLoading(false);
  }

  useEffect(() => {
    getData();
  }, []);

  const addPolicy = async () => {
    if (!selectedPolicies.length) {
      setSelectedPoliciesError(true);
      return;
    } else if (selectedPoliciesError) {
      setSelectedPoliciesError(false);
    }

    try {
      let roleId = currentRole.id;

      const policiesId = selectedPolicies.map((policy) => {
        return policy.id;
      });
      const policyResult = await WzRequest.apiReq('POST', `/security/roles/${roleId}/policies`, {
        params: {
          policy_ids: policiesId.toString(),
        },
      });

      const policiesData = (policyResult.data || {}).data;
      if (policiesData.failed_items && policiesData.failed_items.length) {
        return;
      }
      ErrorHandler.info('Role was successfully updated with the selected policies');
      setSelectedPolicies([]);
      await update();
    } catch (error) {
      ErrorHandler.handle(error, 'There was an error');
    }
  };

  const update = async () => {
    await getData();
  };

  const onChangePolicies = (selectedPolicies) => {
    setSelectedPolicies(selectedPolicies);
  };

  let modal;
  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title="Close flyout"
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText="No, don't do it"
          confirmButtonText="Yes, do it"
        >
          <p style={{ textAlign: 'center' }}>
            There are unsaved changes. Are you sure you want to proceed?
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  return (
    <>
      <WzOverlayMask
        headerZindexLocation="below"
        onClick={() => {
          if (initialSelectedPolicies.length != selectedPolicies.length) {
            setIsModalVisible(true);
          } else {
            closeFlyout(false);
          }
        }}
      >
        <EuiFlyout
          className="wzApp"
          onClose={() => {
            if (initialSelectedPolicies.length != selectedPolicies.length) {
              setIsModalVisible(true);
            } else {
              closeFlyout(false);
            }
          }}
        >
          <EuiFlyoutHeader hasBorder={false}>
            <EuiTitle size="m">
              <h2>
                Edit {role.name} role &nbsp;
                {isReserved && <EuiBadge color="primary">Reserved</EuiBadge>}
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiForm component="form" style={{ padding: 24 }}>
              <EuiFlexGroup>
                <EuiFlexItem grow={true}>
                  <EuiFormRow
                    label="Policies"
                    isInvalid={selectedPoliciesError}
                    error={'At least one policy must be selected.'}
                    helpText="Assign policies to the role."
                  >
                    <EuiComboBox
                      placeholder="Select policies"
                      options={policies}
                      isDisabled={isReserved}
                      selectedOptions={selectedPolicies}
                      onChange={onChangePolicies}
                      isClearable={true}
                      data-test-subj="demoComboBox"
                    />
                  </EuiFormRow>
                </EuiFlexItem>
                <EuiFlexItem grow={true}>
                  <EuiButton
                    style={{ marginTop: 20, maxWidth: 45 }}
                    isDisabled={isReserved}
                    fill
                    onClick={addPolicy}
                  >
                    Add policy
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>

              <EuiSpacer />
            </EuiForm>
            <div style={{ margin: 20 }}>
              <EditRolesTable
                policies={assignedPolicies}
                role={currentRole}
                onChange={update}
                isDisabled={isReserved}
                loading={isLoading}
              />
            </div>
          </EuiFlyoutBody>
        </EuiFlyout>
      </WzOverlayMask>
      {modal}
    </>
  );
};