import React, { useState, useEffect } from 'react';
import {
  EuiTitle,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiForm,
  EuiFieldText,
  EuiOverlayMask,
  EuiFormRow,
  EuiSpacer,
  EuiComboBox,
  EuiConfirmModal,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzFlyout } from '../../common/flyouts';
import { WzButtonPermissions } from '../../common/permissions/button';

export const CreateRole = ({ closeFlyout }) => {
  const [policies, setPolicies] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [roleNameError, setRoleNameError] = useState(false);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [selectedPoliciesError, setSelectedPoliciesError] = useState(false);
  const [initialSelectedPolies] = useState<any[]>([]);
  const [initialRoleName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  async function getData() {
    const policies_request = await WzRequest.apiReq(
      'GET',
      '/security/policies',
      {},
    );
    const policies = (
      (((policies_request || {}).data || {}).data || {}).affected_items || []
    ).map(x => {
      return { label: x.name, id: x.id };
    });
    setPolicies(policies);
  }

  useEffect(() => {
    getData();
  }, []);

  const createUser = async () => {
    if (!roleName) {
      setRoleNameError(true);
      return;
    } else if (roleNameError) {
      setRoleNameError(false);
    }
    if (!selectedPolicies.length) {
      setSelectedPoliciesError(true);
      return;
    } else if (selectedPoliciesError) {
      setSelectedPoliciesError(false);
    }

    try {
      const result = await WzRequest.apiReq('POST', '/security/roles', {
        name: roleName,
      });
      const data = result?.data?.data;
      if (data?.failed_items && data?.failed_items?.length) {
        return;
      }
      let roleId = '';
      if (data?.affected_items) {
        roleId = data.affected_items?.[0]?.id;
      }
      const policiesId = selectedPolicies.map(policy => {
        return policy.id;
      });
      const policyResult = await WzRequest.apiReq(
        'POST',
        `/security/roles/${roleId}/policies`,
        {
          params: {
            policy_ids: policiesId.toString(),
          },
        },
      );

      const policiesData = policyResult?.data?.data;
      if (policiesData?.failed_items && policiesData?.failed_items?.length) {
        return;
      }
      ErrorHandler.info(
        i18n.translate('wazuh.security.createRole.createSuccess', {
          defaultMessage:
            'Role was successfully created with the selected policies',
        }),
      );
    } catch (error) {
      ErrorHandler.handle(
        error,
        i18n.translate('wazuh.security.createRole.createError', {
          defaultMessage: 'There was an error',
        }),
      );
    }
    closeFlyout(true);
  };

  const onChangeRoleName = e => {
    setRoleName(e.target.value);
  };

  const onChangePolicies = selectedPolicies => {
    setSelectedPolicies(selectedPolicies);
  };

  let modal;
  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={i18n.translate(
            'wazuh.security.createRole.unsavedChangesModal.title',
            { defaultMessage: 'Unsubmitted changes' },
          )}
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
            setHasChanges(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText={i18n.translate(
            'wazuh.security.createRole.unsavedChangesModal.cancelButton',
            { defaultMessage: "No, don't do it" },
          )}
          confirmButtonText={i18n.translate(
            'wazuh.security.createRole.unsavedChangesModal.confirmButton',
            { defaultMessage: 'Yes, do it' },
          )}
        >
          <p style={{ textAlign: 'center' }}>
            {i18n.translate(
              'wazuh.security.createRole.unsavedChangesModal.body',
              {
                defaultMessage:
                  'There are unsaved changes. Are you sure you want to proceed?',
              },
            )}
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  useEffect(() => {
    if (
      initialSelectedPolies.length != selectedPolicies.length ||
      initialRoleName != roleName
    ) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [selectedPolicies, roleName]);

  const onClose = () => {
    hasChanges ? setIsModalVisible(true) : closeFlyout(false);
  };

  return (
    <>
      <WzFlyout flyoutProps={{ className: 'wzApp' }} onClose={onClose}>
        <EuiFlyoutHeader hasBorder={false}>
          <EuiTitle size='m'>
            <h2>
              {i18n.translate('wazuh.security.createRole.title', {
                defaultMessage: 'New role',
              })}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiForm component='form' style={{ padding: 24 }}>
            <EuiFormRow
              label={i18n.translate('wazuh.security.createRole.nameLabel', {
                defaultMessage: 'Role name',
              })}
              isInvalid={roleNameError}
              error={i18n.translate('wazuh.security.createRole.nameError', {
                defaultMessage: 'Please provide a role name',
              })}
              helpText={i18n.translate(
                'wazuh.security.createRole.nameHelpText',
                { defaultMessage: 'Introduce a name for this new role.' },
              )}
            >
              <EuiFieldText
                placeholder=''
                value={roleName}
                onChange={e => onChangeRoleName(e)}
                aria-label=''
              />
            </EuiFormRow>
            <EuiFormRow
              label={i18n.translate('wazuh.security.createRole.policiesLabel', {
                defaultMessage: 'Policies',
              })}
              isInvalid={selectedPoliciesError}
              error={i18n.translate('wazuh.security.createRole.policiesError', {
                defaultMessage: 'At least one policy must be selected.',
              })}
              helpText={i18n.translate(
                'wazuh.security.createRole.policiesHelpText',
                { defaultMessage: 'Assign policies to the role.' },
              )}
            >
              <EuiComboBox
                placeholder={i18n.translate(
                  'wazuh.security.createRole.policiesPlaceholder',
                  { defaultMessage: 'Select policies' },
                )}
                options={policies}
                selectedOptions={selectedPolicies}
                onChange={onChangePolicies}
                isClearable={true}
                data-test-subj='demoComboBox'
              />
            </EuiFormRow>
            <EuiSpacer />
            <WzButtonPermissions
              buttonType='default'
              permissions={[
                { action: 'security:create', resource: '*:*:*' },
                { action: 'security:update', resource: '*:*:*' },
              ]}
              fill
              onClick={createUser}
            >
              {i18n.translate('wazuh.security.createRole.createButton', {
                defaultMessage: 'Create role',
              })}
            </WzButtonPermissions>
          </EuiForm>
        </EuiFlyoutBody>
      </WzFlyout>
      {modal}
    </>
  );
};
