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
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

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
      ErrorHandler.handle('There was an error loading roles');
    }
  }, [rolesLoading]);
  
  const getInternalUsers = async () => {
    try {
      const wazuhSecurity = new WazuhSecurity();
      const users = await wazuhSecurity.security.getUsers();
      const _users = users
        .map((item, idx) => {
          return {
            id: idx,
            user: item.username,
            roles: [],
            full_name: item.full_name,
            email: item.email,
          };
        })
        .sort((a, b) => (a.user > b.user ? 1 : a.user < b.user ? -1 : 0));
      setInternalUsers(_users);
    } catch (error) {
      const options = {
        context: `${RolesMapping.name}.getInternalUsers`,
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

  const getRules = async () => {
    try {
      const _rules = await RulesServices.GetRules();
      setRules(_rules);
    } catch (error) {
      const options = {
        context: `${RolesMapping.name}.getRules`,
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

  const initData = async () => {
    setLoadingTable(true);
    await getRules();
    if (currentPlatform) {
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
      <RolesMappingEdit
        rule={selectedRule}
        closeFlyout={(isVisible) => {
          setIsEditingRule(isVisible);
          initData();
        }}
        rolesEquivalences={rolesEquivalences}
        roles={roles}
        internalUsers={internalUsers}
        onSave={async () => await updateRoles()}
        currentPlatform={currentPlatform}
      />
    );
  }
  let createFlyout;
  if (isCreatingRule) {
    editFlyout = (
      <RolesMappingCreate
        closeFlyout={(isVisible) => {
          setIsCreatingRule(isVisible);
          initData();
        }}
        rolesEquivalences={rolesEquivalences}
        roles={roles}
        internalUsers={internalUsers}
        onSave={async () => await updateRoles()}
        currentPlatform={currentPlatform}
      />
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
          {!loadingTable && (
            <div>
              <EuiButton
                onClick={() => {
                  setIsCreatingRule(true);
                }}
              >
                Create Role mapping
              </EuiButton>
              {createFlyout}
              {editFlyout}
            </div>
          )}
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        <RolesMappingTable
          rolesEquivalences={rolesEquivalences}
          loading={loadingTable || rolesLoading}
          rules={rules}
          editRule={(item) => {
            setSelectedRule(item);
            setIsEditingRule(true);
          }}
          updateRules={async () => await updateRoles()}
        ></RolesMappingTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
};
