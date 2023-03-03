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
  EuiOutsideClickDetector,
  EuiConfirmModal,
} from '@elastic/eui';

import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { EditRolesTable } from './edit-role-table';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { WzFlyout } from '../../common/flyouts';
import { i18n } from '@kbn/i18n';
const Descp1 = i18n.translate("wazuh.components.security.roles.Descp1", {
  defaultMessage: "At least one policy must be selected.",
});
const Descp2 = i18n.translate("wazuh.components.security.roles.Descp2", {
  defaultMessage: "Assign policies to the role.",
});
const Descp3 = i18n.translate("wazuh.components.security.roles.Descp3", {
  defaultMessage: "Select policies",
});
const reservedRoles = [
  'administrator',
  'readonly',
  'users_admin',
  'agents_readonly',
  'agents_admin',
  'cluster_readonly',
  'cluster_admin',
];

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
      throw new Error(error);
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
      const options = {
        context: `${EditRole.name}.addPolicy`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
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
          title={i18n.translate('wazuh.public.components.security.roles.edit.unsubmittedChanges', {
              defaultMessage: 'Unsubmitted changes',
            })}
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText={i18n.translate('wazuh.public.components.security.roles.edit.no', {
              defaultMessage: "No, don't do it",
            })}
          confirmButtonText={i18n.translate('wazuh.public.components.security.roles.edit.yes', {
              defaultMessage: 'Yes, do it',
            })}
        >
          <p style={{ textAlign: 'center' }}>
            {
              i18n.translate("wazuh.components.overview.role.sure", {
                defaultMessage: "There are unsaved changes. Are you sure you want to proceed?",
              })
            }
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  const onClose = () => {
    initialSelectedPolicies.length != selectedPolicies.length
      ? setIsModalVisible(true)
      : closeFlyout(false);
  };

  return (
    <>
      <WzFlyout flyoutProps={{className:"wzApp"}} onClose={onClose}>
        <EuiFlyoutHeader hasBorder={false}>
          <EuiTitle size="m">
            <h2>
              {
                i18n.translate("wazuh.components.overview.role.Edit", {
                  defaultMessage: "Edit",
                })} {role.name} {
                i18n.translate("wazuh.components.overview.rolerole", {
                  defaultMessage: "role",
                })} &nbsp;
                            {isReserved && <EuiBadge color="primary">{
                i18n.translate("wazuh.components.overview.rolerole.Reserved", {
                  defaultMessage: "Reserved",
                })}</EuiBadge>}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiForm component="form" style={{ padding: 24 }}>
            <EuiFlexGroup>
              <EuiFlexItem grow={true}>
                <EuiFormRow
                  label={i18n.translate('wazuh.public.components.security.roles.edit.Policies1', {
              defaultMessage: 'Policies',
            })}
                  isInvalid={selectedPoliciesError}
                  error={ Descp1}
                  helpText={Descp2}
                >
                  <EuiComboBox
                    placeholder={Descp3}
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
                  {
                    i18n.translate("wazuh.components.overview.role.Addpolicy", {
                      defaultMessage: "Add policy",
                    })
                  }
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
      </WzFlyout>
      {modal}
    </>
  );
};
