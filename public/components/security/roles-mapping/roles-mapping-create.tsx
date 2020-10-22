import React, { useState } from 'react';
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
  EuiComboBox,
  EuiFieldText,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { RuleEditor } from './rule-editor';

export const RolesMappingCreate = ({ closeFlyout, rolesEquivalences, roles }) => {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [ruleName, setRuleName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getRolesList = (roles) => {
    const list = roles.map(item => {
      return { label: rolesEquivalences[item.id], id: item.id }
    });
    return list;
  };

  const createRule = async (toSaveRule) => {
    try {
      setIsLoading(true);
      const formattedRoles = selectedRoles.map(item => {
        return item.id;
      });
      const result = await WzRequest.apiReq(
        'POST',
        `/security/rules`,
        {
          "name": ruleName,
          "rule": toSaveRule
        }
      );
      const ruleId = ((((result.data || {}).data || {}).affected_items || [])[0] || {}).id;

      await Promise.all(formattedRoles.map(async (role) => await WzRequest.apiReq(
          'POST',
          `/security/roles/${role}/rules`,
          {
            params: {
              rule_ids: ruleId
            }
          }
        )));
      const msg = (result.data || {}).message || "Role mapping was successfully created";
      ErrorHandler.info(msg);
    } catch (error) {
      ErrorHandler.handle(error, "There was an error");
    }
    closeFlyout(false);
  }

  return (
    <EuiFlyout
      onClose={() => closeFlyout(false)}>
      <EuiFlyoutHeader hasBorder={false}>
        <EuiTitle size="m">
          <h2>
            Create new role mapping &nbsp;
                    </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiForm component="form" style={{ padding: 24 }}>
          <EuiFormRow label="Role name"
            isInvalid={false}
            error={'Please provide a role name'}
            helpText="Introduce a name for this role mapping.">
            <EuiFieldText
              placeholder="Role name"
              value={ruleName}
              onChange={e => setRuleName(e.target.value)}
            />
          </EuiFormRow>
          <EuiFormRow label="Roles"
            isInvalid={false}
            error={'At least one role must be selected.'}
            helpText="Assign roles to your users.">
            <EuiComboBox
              placeholder="Select roles"
              options={getRolesList(roles)}
              isDisabled={false}
              selectedOptions={selectedRoles}
              onChange={(roles) => {setSelectedRoles(roles)}}
              isClearable={true}
              data-test-subj="demoComboBox"
            />
          </EuiFormRow>
          <EuiSpacer />
        </EuiForm>
        <EuiFlexGroup style={{ padding: "0px 24px 24px 24px" }}>
          <EuiFlexItem>
            <RuleEditor save={(rule) => createRule(rule)} initialRule={false} isReserved={false} isLoading={isLoading}></RuleEditor>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};