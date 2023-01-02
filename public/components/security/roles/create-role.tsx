import React, { useState, useEffect } from 'react';
import {
  EuiButton,
  EuiTitle,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiForm,
  EuiFieldText,
  EuiOverlayMask,
  EuiOutsideClickDetector,
  EuiFormRow,
  EuiSpacer,
  EuiComboBox,
  EuiConfirmModal,
} from '@elastic/eui';

import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzOverlayMask } from '../../common/util';
import { WzFlyout } from '../../common/flyouts';
import { i18n } from "@kbn/i18n";


const Error1 = i18n.translate("components.addModule.guide.Error1", {
  defaultMessage: "Please provide a role name",
});
const Error2 = i18n.translate("components.addModule.guide.Error2", {
  defaultMessage: "At least one policy must be selected.",
});
const helpText1 = i18n.translate("components.addModule.guide.helpText1", {
  defaultMessage: "Introduce a name for this new role.",
});
const helpText2 = i18n.translate("components.addModule.guide.helpText2", {
  defaultMessage: "Assign policies to the role.",
});
const Descp1 = i18n.translate("components.addModule.guide.Descp1", {
  defaultMessage: "Select policies",
});
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
    const policies_request = await WzRequest.apiReq('GET', '/security/policies', {});
    const policies = ((((policies_request || {}).data || {}).data || {}).affected_items || []).map(
      (x) => {
        return { label: x.name, id: x.id };
      }
    );
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
      const data = (result.data || {}).data;
      if (data.failed_items && data.failed_items.length) {
        return;
      }
      let roleId = '';
      if (data.affected_items && data.affected_items) {
        roleId = data.affected_items[0].id;
      }
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
      ErrorHandler.info('Role was successfully created with the selected policies');
    } catch (error) {
      ErrorHandler.handle(error, 'There was an error');
    }
    closeFlyout(false);
  };

  const onChangeRoleName = (e) => {
    setRoleName(e.target.value);
  };

  const onChangePolicies = (selectedPolicies) => {
    setSelectedPolicies(selectedPolicies);
  };

  let modal;
  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title="Unsubmitted changes"
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
            setHasChanges(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText="No, don't do it"
          confirmButtonText="Yes, do it"
        >
          <p style={{ textAlign: 'center' }}>
            {
  i18n.translate("components.overview.unsaved", {
    defaultMessage: "There are unsaved changes. Are you sure you want to proceed?",
  });
}
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  useEffect(() => {
    if (initialSelectedPolies.length != selectedPolicies.length || initialRoleName != roleName) {
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
          <EuiTitle size="m">
            <h2>{
  i18n.translate("components.overview.Newrole", {
    defaultMessage: "New role",
  });
}</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiForm component="form" style={{ padding: 24 }}>
            <EuiFormRow
              label="Role name"
              isInvalid={roleNameError}
              error={Error1}
              helpText={helpText1}
            >
              <EuiFieldText
                placeholder=""
                value={roleName}
                onChange={(e) => onChangeRoleName(e)}
                aria-label=""
              />
            </EuiFormRow>
            <EuiFormRow
              label="Policies"
              isInvalid={selectedPoliciesError}
              error={Error2}
              helpText={helpText2}
            >
              <EuiComboBox
                placeholder={Descp1}
                options={policies}
                selectedOptions={selectedPolicies}
                onChange={onChangePolicies}
                isClearable={true}
                data-test-subj="demoComboBox"
              />
            </EuiFormRow>
            <EuiSpacer />
            <EuiButton fill onClick={createUser}>
              {
  i18n.translate("components.overview.Createrole", {
    defaultMessage: "Create role",
  });
}
            </EuiButton>
          </EuiForm>
        </EuiFlyoutBody>
      </WzFlyout>
      {modal}
    </>
  );
};
