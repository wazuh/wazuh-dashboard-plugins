import React, { useState, useEffect } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiButton,
  EuiTitle,
  EuiOverlayMask,
  EuiSpacer,
  EuiText,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import { RolesMappingTable } from './components/roles-mapping-table';
import { RolesMappingEdit } from './components/roles-mapping-edit';
import { RolesMappingCreate } from './components/roles-mapping-create';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WazuhSecurity } from '../../../factories/wazuh-security';
import { useApiService } from '../../common/hooks/useApiService';
import { Rule } from '../rules/types/rule.type';
import { Role } from '../roles/types/role.type';
import RolesServices from '../roles/services';
import RulesServices from '../rules/services';
import { useSelector } from 'react-redux';

export const RolesMapping = () => {
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [selectedRule, setSelectedRule] = useState({});
  const [rolesEquivalences, setRolesEquivalences] = useState({});
  const [rolesLoading, roles, rolesError] = useApiService<Role[]>(RolesServices.GetRoles, {});
  const [internalUsers, setInternalUsers] = useState([]);
  const currentPlatform = useSelector((state: any) => state.appStateReducers.currentPlatform);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChangeCreate, setHasChangeCreate] = useState(false);
  const [hasChangeEdit, setHasChangeEdit] = useState(false);
  
  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);


  useEffect(() => {
    initData();    
  }, []);

  useEffect(() => {
    if (!rolesLoading && (roles || [])) {
      const _rolesObject = (roles || []).reduce(
        (rolesObj, role) => ({ ...rolesObj, [role.id]: role.name }),
        {}
      );
      setRolesEquivalences(_rolesObject);
    }
    if (rolesError) {
      ErrorHandler.handle('There was an error loading roles');
    }
  }, [rolesLoading]);
  
  const getInternalUsers = async () => {
    try {
      const wazuhSecurity = new WazuhSecurity();
      const users = await wazuhSecurity.security.getUsers();
      const _users = users.map((item, idx) => {
        return {
          id: idx,
          user: item.username,
          roles: [],
          full_name: item.full_name,
          email: item.email,
        };
      }).sort((a, b) => (a.user > b.user) ? 1 : (a.user < b.user) ? -1 : 0);      
      setInternalUsers(_users);
    } catch (error) {
      ErrorHandler.handle('There was an error loading internal users');
    }
  };

  const getRules = async () => {
    try {
      const _rules = await RulesServices.GetRules();
      setRules(_rules);
    } catch (error) {
      ErrorHandler.handle('There was an error loading rules');
    }
  };

  const initData = async () => {
    setLoadingTable(true);
    await getRules();
    if(currentPlatform){
      await getInternalUsers();
    };
    setLoadingTable(false);
  };

  const updateRoles = async () => {
    await getRules();
  };
  
  let editFlyout;
  if (isEditingRule) {
    editFlyout = (
      <EuiOverlayMask
        headerZindexLocation="below"
        onClick={() => {
          console.log('')
          setIsModalVisible(hasChangeEdit);
        }}
      >
        <RolesMappingEdit
          rule={selectedRule}
          closeFlyout={() => {
            setIsModalVisible(hasChangeEdit);
            initData();
          }}
          rolesEquivalences={rolesEquivalences}
          roles={roles}
          internalUsers={internalUsers}
          onSave={async () => await updateRoles()}
          currentPlatform={currentPlatform}
          onChangeMappingEdit={(hasChange) => setHasChangeEdit(hasChange)}
        />
       </EuiOverlayMask>
    );
  }
  let createFlyout;
  if (isCreatingRule) {
    console.log('\n Antes de onclick',hasChangeCreate);
    editFlyout = (
      <EuiOverlayMask
        headerZindexLocation="below"
        onClick={() => {
          console.log('\n 1',hasChangeCreate);
          if (hasChangeCreate) {
            setIsModalVisible(hasChangeCreate);
          } else {
            setIsCreatingRule(false);
            initData();
          }
        }}
      >
        <RolesMappingCreate
          closeFlyout={() => {
            console.log('\N2',hasChangeCreate);
            if (hasChangeCreate) {
              setIsModalVisible(hasChangeCreate);
            } else {
              console.log("ENTREA EN EL ELSE 2")
              setIsCreatingRule(false);
              initData();
            }
          }}
          rolesEquivalences={rolesEquivalences}
          roles={roles}
          internalUsers={internalUsers}
          onSave={async () => await updateRoles()}
          currentPlatform={currentPlatform}
          onChangeMappingCreate={(hasChange) => {
            console.log("\nEl onChange de role mapping",hasChange)
            setHasChangeCreate(hasChange);
          }}
        />
      </EuiOverlayMask>
    );
  }
  let modal;
  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiModal onClose={closeModal}>
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
                setIsCreatingRule(false);
                setIsEditingRule(false);
                setHasChangeCreate(false);
                setHasChangeEdit(false);
              }}
              fill
            >
              Yes
            </EuiButton>
            <EuiButton
              onClick={() => {
                setIsModalVisible(false);
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
  console.log("antes de return",hasChangeCreate)
  return (
    <EuiPageContent>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
            <h2>Role mapping</h2>
          </EuiTitle>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          {
            !loadingTable
            &&
            <div>
              <EuiButton onClick={() => {setIsCreatingRule(true)}}>Create Role mapping</EuiButton>
              {modal}
              {createFlyout}
              {editFlyout}
            </div>
          }
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        <RolesMappingTable
          rolesEquivalences={rolesEquivalences}
          loading={loadingTable || rolesLoading}
          rules={rules}
          editRule={item => {
            setSelectedRule(item);
            setIsEditingRule(true);
            console.log('ENTRA AQUI Y NO LO SABIA')
          }}
          updateRules={async () => await updateRoles()}
        ></RolesMappingTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
};
