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
  EuiConfirmModal,
  EuiFieldText,
} from '@elastic/eui';
import { ErrorHandler } from '../../../../react-services/error-handler';
import { RuleEditor } from './rule-editor';
import RulesServices from '../../rules/services';
import RolesServices from '../../roles/services';
import { WzAPIUtils } from '../../../../react-services/wz-api-utils';
import { WzOverlayMask } from '../../../common/util'
import _ from 'lodash';

export const RolesMappingEdit = ({
  rule,
  closeFlyout,
  rolesEquivalences,
  roles,
  internalUsers,
  onSave,
  currentPlatform,
}) => {
  const getEquivalences = (roles) => {
    const list = roles.map((item) => {
      return { label: rolesEquivalences[item], id: item };
    });
    return list;
  };

  const [selectedRoles, setSelectedRoles] = useState<any[]>(getEquivalences(rule.roles));
  const [ruleName, setRuleName] = useState<string>(rule.name);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChangeMappingRules, setHasChangeMappingRules] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const getRolesList = (roles) => {
    const list = roles.map((item) => {
      return { label: rolesEquivalences[item.id], id: item.id };
    });
    return list;
  };

  const editRule = async (toSaveRule) => {
    try {
      setIsLoading(true);
      const formattedRoles = selectedRoles.map((item) => {
        return item.id;
      });

      await RulesServices.UpdateRule(rule.id, {
        name: ruleName,
        rule: toSaveRule,
      });

      const toAdd = formattedRoles.filter((value) => !rule.roles.includes(value));
      const toRemove = rule.roles.filter((value) => !formattedRoles.includes(value));
      await Promise.all(
        toAdd.map(async (role) => {
          return RolesServices.AddRoleRules(role, [rule.id]);
        })
      );

      await Promise.all(
        toRemove.map(async (role) => {
          return RolesServices.RemoveRoleRules(role, [rule.id]);
        })
      );

      ErrorHandler.info('Role mapping was successfully updated');
    } catch (error) {
      ErrorHandler.handle(error, 'There was an error');
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
          title="Close flyout"
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
            setHasChanges(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText="No, don't do it"
          confirmButtonText="Yes, do it"
          defaultFocusedButton="confirm"
        >
          <p style={{ textAlign: 'center' }}>
            There are unsaved changes. Are you sure you want to proceed?
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  useEffect(() => {
    const initialRoles = getEquivalences(rule.roles);
    if (rule.name != ruleName || !_.isEqual(initialRoles, selectedRoles) || hasChangeMappingRules) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [selectedRoles, ruleName, hasChangeMappingRules]);

  return (
    <>
      <WzOverlayMask
        headerZindexLocation="below"
        onClick={() => {
          if (hasChanges) {
            setIsModalVisible(true);
          } else {
            closeFlyout(false);
          }
        }}
      >
        <EuiFlyout className="wzApp" onClose={() => {
          if (hasChanges) {
            setIsModalVisible(true);
          } else {
            closeFlyout(false);
          }
        }}>
          <EuiFlyoutHeader hasBorder={false}>
            <EuiTitle size="m">
              <h2>
                Edit <strong>{rule.name}&nbsp;&nbsp;</strong>
                {WzAPIUtils.isReservedID(rule.id) && <EuiBadge color="primary">Reserved</EuiBadge>}
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiForm component="form" style={{ padding: 24 }}>
              <EuiFormRow
                label="Role name"
                isInvalid={false}
                error={'Please provide a role name'}
                helpText="Introduce a name for this role mapping."
              >
                <EuiFieldText
                  placeholder=""
                  disabled={WzAPIUtils.isReservedID(rule.id)}
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  aria-label=""
                />
              </EuiFormRow>
              <EuiFormRow
                label="Roles"
                isInvalid={false}
                error={'At least one role must be selected.'}
                helpText="Assign roles to your users."
              >
                <EuiComboBox
                  placeholder="Select roles"
                  options={getRolesList(roles)}
                  isDisabled={WzAPIUtils.isReservedID(rule.id)}
                  selectedOptions={selectedRoles}
                  onChange={(roles) => {
                    setSelectedRoles(roles);
                  }}
                  isClearable={true}
                  data-test-subj="demoComboBox"
                />
              </EuiFormRow>
              <EuiSpacer />
            </EuiForm>
            <EuiFlexGroup style={{ padding: '0px 24px 24px 24px' }}>
              <EuiFlexItem>
                <RuleEditor
                  save={(rule) => editRule(rule)}
                  initialRule={rule.rule}
                  isLoading={isLoading}
                  isReserved={WzAPIUtils.isReservedID(rule.id)}
                  internalUsers={internalUsers}
                  currentPlatform={currentPlatform}
                  onFormChange={(hasChange) => setHasChangeMappingRules(hasChange)}
                ></RuleEditor>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutBody>
        </EuiFlyout>
      </WzOverlayMask>
      {modal}
    </>
  );
};
