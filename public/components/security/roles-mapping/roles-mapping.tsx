import React, { useState, useEffect } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiButton,
  EuiTitle,
  EuiOverlayMask,
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
      ErrorHandler.error('There was an error loading roles');
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
      ErrorHandler.error('There was an error loading internal users');
    }
  };

  const getRules = async () => {
    try {
      const _rules = await RulesServices.GetRules();
      setRules(_rules);
    } catch (error) {
      ErrorHandler.error('There was an error loading rules');
    }
  };

  const initData = async () => {
    setLoadingTable(true);
    await getRules();
    if(currentPlatform !== "elastic"){
      await getInternalUsers();
    }
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
          setIsEditingRule(false);
        }}
      >
        <RolesMappingEdit
          rule={selectedRule}
          closeFlyout={isVisible => {
            setIsEditingRule(isVisible);
            initData();
          }}
          rolesEquivalences={rolesEquivalences}
          roles={roles}
          internalUsers={internalUsers}
          onSave={async () => await updateRoles()}
          currentPlatform={currentPlatform}
        />
      </EuiOverlayMask>
    );
  }
  let createFlyout;
  if (isCreatingRule) {
    editFlyout = (
      <EuiOverlayMask
        headerZindexLocation="below"
        onClick={() => {
          setIsCreatingRule(false);
        }}
      >
        <RolesMappingCreate
          closeFlyout={isVisible => {
            setIsCreatingRule(isVisible);
            initData();
          }}
          rolesEquivalences={rolesEquivalences}
          roles={roles}
          internalUsers={internalUsers}
          onSave={async () => await updateRoles()}
          currentPlatform={currentPlatform}
        />
      </EuiOverlayMask>
    );
  }

  return (
    <EuiPageContent>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
            <h2>Role mapping</h2>
          </EuiTitle>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          <div>
            <EuiButton onClick={() => setIsCreatingRule(true)}>Create Role mapping</EuiButton>
            {createFlyout}
            {editFlyout}
          </div>
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
          }}
          updateRules={async () => await updateRoles()}
        ></RolesMappingTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
};
