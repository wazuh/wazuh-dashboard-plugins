import React, { useState, useEffect, useCallback } from 'react';
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
import { Rule } from '../rules/types/rule.type';
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
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [selectedRule, setSelectedRule] = useState({});
  const [rolesEquivalences, setRolesEquivalences] = useState({});
  const [rolesLoading, roles, rolesError] = useApiService<Role[]>(
    RolesServices.GetRoles,
    {},
  );
  const [internalUsers, setInternalUsers] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const currentPlatform = useSelector(
    (state: any) => state.appStateReducers.currentPlatform,
  );

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

  const getData = async (pageIndex = 0, pageSize = 10) => {
    try {
      const offset = pageIndex * pageSize;
      const { rules: _rules, total } = await RulesServices.GetRules(
        offset,
        pageSize,
      );
      setRules(_rules);
      setTotalItems(total);
      setPageIndex(pageIndex);
      setPageSize(pageSize);
    } catch (error) {
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
    }
  };

  const initData = async () => {
    setLoadingTable(true);
    await getData();
    if (currentPlatform) {
      await getInternalUsers();
    }
    setLoadingTable(false);
  };

  const refreshCurrentPage = useCallback(() => {
    return getData(pageIndex, pageSize);
  }, [pageIndex, pageSize]);

  const handleTableChange = ({ page }) => {
    if (page) {
      // If pageSize changed, reset to first page
      const newPageIndex = page.size !== pageSize ? 0 : page.index;
      getData(newPageIndex, page.size);
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
