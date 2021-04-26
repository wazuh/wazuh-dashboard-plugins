import React, { useEffect, useState, useRef } from 'react';
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
  EuiOverlayMask,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiModalHeader,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import { ErrorHandler } from '../../../../react-services/error-handler';
import { RuleEditor } from './rule-editor';
import RulesServices from '../../rules/services';
import RolesServices from '../../roles/services';

export const RolesMappingCreate = ({
  closeFlyout,
  rolesEquivalences,
  roles,
  internalUsers,
  onSave,
  currentPlatform,
  // onChangeMappingCreate
}) => {
  const [selectedRoles, setSelectedRoles] = useState<any[]>([]);
  const [ruleName, setRuleName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChangeMappingRules, setHasChangeMappingRules] = useState(false);
  const [initialSelectedRoles] = useState<any[]>([]);
  const [initialRuleName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isMount, setIsMount] = useState(false);
  const contador = useRef(0);
  const timeStamp = Date.now();
  const getRolesList = () => {
    const list = roles.map(item => {
      return { label: rolesEquivalences[item.id], id: item.id };
    });
    return list;
  };

  const createRule = async toSaveRule => {
    try {
      setIsLoading(true);
      const formattedRoles = selectedRoles.map(item => {
        return item.id;
      });
      const newRule = await RulesServices.CreateRule({
        name: ruleName,
        rule: toSaveRule,
      });
      await Promise.all(
        formattedRoles.map(async role => await RolesServices.AddRoleRules(role, [newRule.id]))
      );
      ErrorHandler.info('Role mapping was successfully created');
    } catch (error) {
      ErrorHandler.handle(error, 'There was an error');
    }
    onSave();
    closeFlyout(false);
  };

  useEffect(() => {
    setIsMount(true)

    return () => setIsMount(false)
  },[])


  const isChange=() => {
    if (initialSelectedRoles.length != selectedRoles.length || initialRuleName != ruleName || hasChangeMappingRules){
      setHasChanges(true);
    }else{
      setHasChanges(false);
    }
  };

  let modal;
  if (isModalVisible) {
    console.log('ENTRA EN EL MODAL')
    modal = (
      <EuiOverlayMask>
        <EuiModal onClose={() => setIsModalVisible(false)}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>Modal title</h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            If you go back the changes will disappeared. Are you sure?
            <EuiSpacer />
          </EuiModalBody>

          <EuiModalFooter>
            <EuiButton
              onClick={() => {console.log("ENTRA AQUI???")
                setIsModalVisible(false);
                closeFlyout(false);
                setHasChanges(false);
                // setHasChangeCreate(false);
                // setHasChangeEdit(false);
              }}
              fill
            >
              Yes
            </EuiButton>
            <EuiButton
              onClick={() => {
                setIsModalVisible(false);
                closeFlyout(false)
              }}
              fill
            >
              No
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      </EuiOverlayMask>
    );
  }

  // console.log("CONTADOR",contador.current)
  const prueba = () => {
    console.log("\n",initialSelectedRoles.length,'\n', selectedRoles.length,'\n', initialRuleName,'\n' ,ruleName, '\n', hasChangeMappingRules,'\n',timeStamp)
  }
  return (
    <>
    <EuiOverlayMask
        headerZindexLocation="below"
        onClick={prueba}
        //   console.log("FUERA DEL IF",initialSelectedRoles.length != selectedRoles.length || initialRuleName != ruleName || hasChangeMappingRules)
        //   console.log("\n",initialSelectedRoles.length,'\n', selectedRoles.length,'\n', initialRuleName,'\n' ,ruleName, '\n', hasChangeMappingRules)
        //   if (initialSelectedRoles.length != selectedRoles.length || initialRuleName != ruleName || hasChangeMappingRules){
        //     // setIsModalVisible(true);
        //     console.log("ENTRA EN EL IF",initialSelectedRoles.length != selectedRoles.length || initialRuleName != ruleName || hasChangeMappingRules)
        //   }else{
        //     console.log("ENTRA EN EL ELSE",initialSelectedRoles.length != selectedRoles.length || initialRuleName != ruleName || hasChangeMappingRules)
        //     // closeFlyout(false);
        //   }
        //   // console.log('\n ENTRA AQUIasjdfasdfasd',hasChanges);
        //   // if (hasChanges) {
        //   //   console.log('\n ENTRA DENTRO DEL IF',hasChanges);
        //   //   isMount && setIsModalVisible(hasChanges);
        //   // } else {
        //   //   console.log('\n ENTRA EN EL ELSE',hasChanges);
        //   //   closeFlyout(true);
        //   //   // initData();
        //   // }
        // }}
      >
    <EuiFlyout className="wzApp" onClose={() => closeFlyout(false)}>
      <EuiFlyoutHeader hasBorder={false}>
        <EuiTitle size="m">
          <h2>Create new role mapping &nbsp;</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiForm component="form" style={{ padding: 24 }}>
          <EuiFormRow
            label="Role mapping name"
            isInvalid={false}
            error={'Please provide a role mapping name'}
            helpText="Introduce a name for this role mapping."
          >
            <EuiFieldText
              placeholder="Role name"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
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
              options={getRolesList()}
              isDisabled={false}
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
              save={(rule) => createRule(rule)}
              initialRule={false}
              isReserved={false}
              isLoading={isLoading}
              internalUsers={internalUsers}
              currentPlatform={currentPlatform}
              onFormChange={(hasChange) => {
                setHasChangeMappingRules(hasChange)}}
            ></RuleEditor>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>
    </EuiFlyout>
    </EuiOverlayMask>
    {modal}
    </>
  );
};
