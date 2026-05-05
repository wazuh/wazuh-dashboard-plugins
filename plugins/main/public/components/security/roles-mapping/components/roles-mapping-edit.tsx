import React, { useEffect, useState } from 'react';
import {
  EuiTitle,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiComboBox,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiFieldText,
} from '@elastic/eui';
import { ErrorHandler } from '../../../../react-services/error-handler';
import { RuleEditor } from './rule-editor';
import RulesServices from '../../rules/services';
import RolesServices from '../../roles/services';
import { WzAPIUtils } from '../../../../react-services/wz-api-utils';
import _ from 'lodash';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { WzFlyout } from '../../../common/flyouts';

export const RolesMappingEdit = ({
  rule,
  closeFlyout,
  rolesEquivalences,
  roles,
  internalUsers,
  onSave,
  currentPlatform,
}) => {
  const getEquivalences = roles => {
    const list = roles.map(item => {
      return { label: rolesEquivalences[item], id: item };
    });
    return list;
  };

  const [selectedRoles, setSelectedRoles] = useState<any[]>(
    getEquivalences(wazuh.rule.roles),
  );
  const [ruleName, setRuleName] = useState<string>(wazuh.rule.name);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChangeMappingRules, setHasChangeMappingRules] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const getRolesList = roles => {
    const list = roles.map(item => {
      return { label: rolesEquivalences[item.id], id: item.id };
    });
    return list;
  };

  const editRule = async toSaveRule => {
    try {
      setIsLoading(true);
      const formattedRoles = selectedRoles.map(item => {
        return item.id;
      });

      await RulesServices.UpdateRule(wazuh.rule.id, {
        name: ruleName,
        rule: toSaveRule,
      });

      const toAdd = formattedRoles.filter(
        value => !wazuh.rule.roles.includes(value),
      );
      const toRemove = wazuh.rule.roles.filter(
        value => !formattedRoles.includes(value),
      );
      await Promise.all(
        toAdd.map(async role => {
          return RolesServices.AddRoleRules(role, [wazuh.rule.id]);
        }),
      );

      await Promise.all(
        toRemove.map(async role => {
          return RolesServices.RemoveRoleRules(role, [wazuh.rule.id]);
        }),
      );

      ErrorHandler.info('Role mapping was successfully updated');
    } catch (error) {
      const options = {
        context: `${RolesMappingEdit.name}.editRule`,
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
    onSave();
    setIsLoading(false);
    closeFlyout(false);
  };

  let modal;
  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title='Unsubmitted changes'
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
            setHasChanges(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText="No, don't do it"
          confirmButtonText='Yes, do it'
          defaultFocusedButton='confirm'
        >
          <p style={{ textAlign: 'center' }}>
            There are unsaved changes. Are you sure you want to proceed?
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  useEffect(() => {
    const initialRoles = getEquivalences(wazuh.rule.roles);
    if (
      wazuh.rule.name != ruleName ||
      !_.isEqual(initialRoles, selectedRoles) ||
      hasChangeMappingRules
    ) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [selectedRoles, ruleName, hasChangeMappingRules]);

  const onClose = () => {
    hasChanges ? setIsModalVisible(true) : closeFlyout(false);
  };

  return (
    <>
      <WzFlyout flyoutProps={{ className: 'wzApp' }} onClose={onClose}>
        <EuiFlyoutHeader hasBorder={false}>
          <EuiTitle size='m'>
            <h2>
              Edit <strong>{wazuh.rule.name}&nbsp;&nbsp;</strong>
              {WzAPIUtils.isReservedID(wazuh.rule.id) && (
                <EuiBadge color='primary'>Reserved</EuiBadge>
              )}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiForm component='form' style={{ padding: 24 }}>
            <EuiFormRow
              label='Role name'
              isInvalid={false}
              error={'Please provide a role name'}
              helpText='Introduce a name for this role mapping.'
            >
              <EuiFieldText
                placeholder=''
                disabled={WzAPIUtils.isReservedID(wazuh.rule.id)}
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
                aria-label=''
              />
            </EuiFormRow>
            <EuiFormRow
              label='Roles'
              isInvalid={false}
              error={'At least one role must be selected.'}
              helpText='Assign roles to your users.'
            >
              <EuiComboBox
                placeholder='Select roles'
                options={getRolesList(roles)}
                isDisabled={WzAPIUtils.isReservedID(wazuh.rule.id)}
                selectedOptions={selectedRoles}
                onChange={roles => {
                  setSelectedRoles(roles);
                }}
                isClearable={true}
                data-test-subj='demoComboBox'
              />
            </EuiFormRow>
            <EuiSpacer />
          </EuiForm>
          <EuiFlexGroup style={{ padding: '0px 24px 24px 24px' }}>
            <EuiFlexItem>
              <RuleEditor
                save={rule => editRule(rule)}
                saveButtonPermissions={[
                  // Require security:update:{rule_id} if some roles were added
                  ...(selectedRoles
                    .map(item => item.id)
                    .filter(value => !wazuh.rule.roles.includes(value)).length >
                  0
                    ? [
                        {
                          action: 'security:update',
                          resource: `rule:id:${wazuh.rule.id}`,
                        },
                      ]
                    : []),
                  // Require security:delete:{rule_id} if some roles were removed
                  ...(wazuh.rule.roles.filter(
                    value =>
                      !selectedRoles.map(item => item.id).includes(value),
                  ) > 0
                    ? [
                        {
                          action: 'security:delete',
                          resource: `rule:id:${wazuh.rule.id}`,
                        },
                      ]
                    : []),
                ]}
                initialRule={wazuh.rule.rule}
                isLoading={isLoading}
                isReserved={WzAPIUtils.isReservedID(wazuh.rule.id)}
                internalUsers={internalUsers}
                currentPlatform={currentPlatform}
                onFormChange={hasChange => setHasChangeMappingRules(hasChange)}
              ></RuleEditor>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutBody>
      </WzFlyout>
      {modal}
    </>
  );
};
