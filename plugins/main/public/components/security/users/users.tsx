import React, { useState, useEffect } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiTitle,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { UsersTable } from './components/users-table';
import { CreateUser } from './components/create-user';
import { EditUser } from './components/edit-user';
import UsersServices from './services';
import RolesServices from '../roles/services';
import { User } from './types/user.type';
import { useApiService } from '../../common/hooks/useApiService';
import { Role } from '../roles/types/role.type';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { withUserAuthorizationPrompt } from '../../common/hocs';
import { WzButtonPermissions } from '../../common/permissions/button';
import { closeFlyout } from '../../common/flyouts/close-flyout-security';

export const Users = withUserAuthorizationPrompt([
  { action: 'security:read', resource: 'user:id:*' },
  { action: 'security:read', resource: 'role:id:*' },
])(() => {
  const [isEditFlyoutVisible, setIsEditFlyoutVisible] = useState(false);
  const [isCreateFlyoutVisible, setIsCreateFlyoutVisible] = useState(false);
  const [editingUser, setEditingUser] = useState({});
  const [users, setUsers] = useState([] as User[]);
  const [rolesLoading, roles, rolesError] = useApiService<Role[]>(
    RolesServices.GetRoles,
    {},
  );
  const [securityError, setSecurityError] = useState(false);
  const [rolesObject, setRolesObject] = useState({});

  const getUsers = async () => {
    try {
      const _users = await UsersServices.GetUsers();
      setUsers(_users as User[]);
    } catch (error) {
      setUsers([]);
      setSecurityError(true);
      const options = {
        context: `${Users.name}.getUsers`,
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

  useEffect(() => {
    if (!rolesLoading && (roles || []).length) {
      const _rolesObject = (roles || []).reduce(
        (rolesObj, role) => ({ ...rolesObj, [role.id]: role.name }),
        {},
      );
      setRolesObject(_rolesObject);
    }
    if (rolesError) {
      setSecurityError(true);
    }
  }, [rolesLoading]);

  useEffect(() => {
    getUsers();
  }, []);

  let editFlyout, createFlyout;
  const closeEditFlyout = refresh => {
    closeFlyout(refresh, setIsEditFlyoutVisible, getUsers);
  };

  const closeCreateFlyout = refresh => {
    closeFlyout(refresh, setIsCreateFlyoutVisible, getUsers);
  };

  if (securityError) {
    return (
      <EuiEmptyPrompt
        iconType='securityApp'
        title={<h2>You need permission to manage users</h2>}
        body={<p>Contact your system administrator.</p>}
      />
    );
  }
  if (isEditFlyoutVisible) {
    editFlyout = (
      <EditUser
        currentUser={editingUser}
        closeFlyout={closeEditFlyout}
        rolesObject={rolesObject}
      />
    );
  }

  if (isCreateFlyoutVisible) {
    createFlyout = <CreateUser closeFlyout={closeCreateFlyout} />;
  }

  const showEditFlyover = item => {
    setEditingUser(item);
    setIsEditFlyoutVisible(true);
  };

  return (
    <EuiPageContent>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
            <h2>Users</h2>
          </EuiTitle>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          {!rolesLoading && (
            <div>
              <WzButtonPermissions
                buttonType='default'
                permissions={[
                  { action: 'security:create_user', resource: '*:*:*' },
                ]}
                onClick={() => setIsCreateFlyoutVisible(true)}
              >
                Create user
              </WzButtonPermissions>
              {createFlyout}
            </div>
          )}
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        <UsersTable
          users={users}
          editUserFlyover={showEditFlyover}
          rolesLoading={rolesLoading}
          roles={rolesObject}
          onSave={async () => await getUsers()}
        ></UsersTable>
      </EuiPageContentBody>
      {editFlyout}
    </EuiPageContent>
  );
});
