import React, { useState, useEffect } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiTitle,
} from '@elastic/eui';
import { RolesMappingTable } from './components/roles-mapping-table';
import { RolesMappingEdit } from './components/roles-mapping-edit';
import { RolesMappingCreate } from './components/roles-mapping-create';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WazuhSecurity } from '../../../factories/wazuh-security';
import { useApiService } from '../../common/hooks/useApiService';
import { usePagination } from '../../common/hooks/usePagination';
import { Role } from '../roles/types/role.type';
import RolesServices from '../roles/services';
import RulesServices from '../rules/services';
import { useSelector } from 'react-redux';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { withUserAuthorizationPrompt } from '../../common/hocs';
import { WzButtonPermissions } from '../../common/permissions/button';

export const RolesMapping = withUserAuthorizationPrompt([
  { action: 'security:read', resource: 'role:id:*' },
  { action: 'security:read', resource: 'rule:id:*' },
])(() => {
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [selectedRule, setSelectedRule] = useState({});
  const [rolesEquivalences, setRolesEquivalences] = useState({});
  const [rolesLoading, roles, rolesError] = useApiService<Role[]>(
    RolesServices.GetRoles,
    {},
  );
  const [internalUsers, setInternalUsers] = useState([]);
  const currentPlatform = useSelector(
    (state: any) => state.appStateReducers.currentPlatform,
  );

  const handlePaginationError = (error: any) => {
    const options = {
      context: `${RolesMapping.name}.getData`,
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
  };

  const {
    items: rules,
    loading: loadingTable,
    pageIndex,
    pageSize,
    totalItems,
    getData,
    refreshCurrentPage,
    onTableChange: handleTableChange,
  } = usePagination(RulesServices.GetRules, handlePaginationError);

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (!rolesLoading && (roles || [])) {
      const _rolesObject = (roles || []).reduce(
        (rolesObj, role) => ({ ...rolesObj, [role.id]: role.name }),
        {},
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

  const initData = async () => {
    await getData();
    if (currentPlatform) {
      await getInternalUsers();
    }
  };

  const closeEditingFlyout = needRefresh => {
    if (needRefresh) {
      refreshCurrentPage();
    }
    setIsEditingRule(false);
  };

  const closeCreatingFlyout = needRefresh => {
    if (needRefresh) {
      refreshCurrentPage();
    }
    setIsCreatingRule(false);
  };

  let editFlyout;
  if (isEditingRule) {
    editFlyout = (
      <RolesMappingEdit
        rule={selectedRule}
        closeFlyout={closeEditingFlyout}
        rolesEquivalences={rolesEquivalences}
        roles={roles}
        internalUsers={internalUsers}
        onSave={async () => await refreshCurrentPage()}
        currentPlatform={currentPlatform}
      />
    );
  }
  let createFlyout;
  if (isCreatingRule) {
    createFlyout = (
      <RolesMappingCreate
        closeFlyout={closeCreatingFlyout}
        rolesEquivalences={rolesEquivalences}
        roles={roles}
        internalUsers={internalUsers}
        onSave={async () => await refreshCurrentPage()}
        currentPlatform={currentPlatform}
      />
    );
  }
  return (
    <EuiPageContent>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
            <h2>Roles mapping</h2>
          </EuiTitle>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          {!loadingTable && (
            <div>
              <WzButtonPermissions
                buttonType='default'
                permissions={[{ action: 'security:create', resource: '*:*:*' }]}
                onClick={() => {
                  setIsCreatingRule(true);
                }}
              >
                Create Role mapping
              </WzButtonPermissions>
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
          editRule={item => {
            setSelectedRule(item);
            setIsEditingRule(true);
          }}
          updateRules={refreshCurrentPage}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalItems={totalItems}
          onTableChange={handleTableChange}
        ></RolesMappingTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
});
