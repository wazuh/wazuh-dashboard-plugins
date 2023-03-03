import React, { useEffect, useState } from 'react';
import {
  EuiTitle,
  EuiFlyout,
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
  EuiOutsideClickDetector,
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
import { i18n } from '@kbn/i18n';

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
    getEquivalences(rule.roles),
  );
  const [ruleName, setRuleName] = useState<string>(rule.name);
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

      await RulesServices.UpdateRule(rule.id, {
        name: ruleName,
        rule: toSaveRule,
      });

      const toAdd = formattedRoles.filter(value => !rule.roles.includes(value));
      const toRemove = rule.roles.filter(
        value => !formattedRoles.includes(value),
      );
      await Promise.all(
        toAdd.map(async role => {
          return RolesServices.AddRoleRules(role, [rule.id]);
        }),
      );

      await Promise.all(
        toRemove.map(async role => {
          return RolesServices.RemoveRoleRules(role, [rule.id]);
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
          title={i18n.translate(
            'wazuh.public.components.security.role.mapping.edit.UnsubmittedChanges',
            {
              defaultMessage: 'Unsubmitted changes',
            },
          )}
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
            setHasChanges(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText={i18n.translate(
            'wazuh.public.components.security.role.mapping.edit.no',
            {
              defaultMessage: "No, don't do it",
            },
          )}
          confirmButtonText={i18n.translate(
            'wazuh.public.components.security.role.mapping.edit.yes',
            {
              defaultMessage: 'Yes, do it',
            },
          )}
          defaultFocusedButton='confirm'
        >
          <p style={{ textAlign: 'center' }}>
            {i18n.translate(
              'wazuh.public.components.security.role.mapping.edit.want',
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
    const initialRoles = getEquivalences(rule.roles);
    if (
      rule.name != ruleName ||
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
              {i18n.translate(
                'wazuh.public.components.security.role.mapping.edit.Edit',
                {
                  defaultMessage: 'Edit',
                },
              )}
              <strong>{rule.name}&nbsp;&nbsp;</strong>
              {WzAPIUtils.isReservedID(rule.id) && (
                <EuiBadge color='primary'>Reserved</EuiBadge>
              )}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiForm component='form' style={{ padding: 24 }}>
            <EuiFormRow
              label={i18n.translate(
                'wazuh.public.components.security.role.mapping.edit.Rolename',
                {
                  defaultMessage: 'Role name',
                },
              )}
              isInvalid={false}
              error={i18n.translate(
                'wazuh.public.components.security.role.mapping.edit.provideName',
                {
                  defaultMessage: 'Please provide a role name',
                },
              )}
              helpText={i18n.translate(
                'wazuh.public.components.security.role.mapping.edit.introName',
                {
                  defaultMessage: 'Introduce a name for this role mapping.',
                },
              )}
            >
              <EuiFieldText
                placeholder=''
                disabled={WzAPIUtils.isReservedID(rule.id)}
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
                aria-label=''
              />
            </EuiFormRow>
            <EuiFormRow
              label={i18n.translate(
                'wazuh.public.components.security.role.mapping.edit.Roles',
                {
                  defaultMessage: 'Roles',
                },
              )}
              isInvalid={false}
              error={i18n.translate(
                'wazuh.public.components.security.role.mapping.edit.role1',
                {
                  defaultMessage: 'At least one role must be selected.',
                },
              )}
              helpText={i18n.translate(
                'wazuh.public.components.security.role.mapping.edit.users',
                {
                  defaultMessage: 'Assign roles to your users.',
                },
              )}
            >
              <EuiComboBox
                placeholder={i18n.translate(
                  'wazuh.public.components.security.role.mapping.edit.selroles',
                  {
                    defaultMessage: 'Select roles',
                  },
                )}
                options={getRolesList(roles)}
                isDisabled={WzAPIUtils.isReservedID(rule.id)}
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
                initialRule={rule.rule}
                isLoading={isLoading}
                isReserved={WzAPIUtils.isReservedID(rule.id)}
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
