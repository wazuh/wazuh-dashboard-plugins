import React, { useState, useEffect } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiButton,
  EuiTitle,
  EuiOverlayMask,
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

export const Users = () => {
  const [isEditFlyoutVisible, setIsEditFlyoutVisible] = useState(false);
  const [isCreateFlyoutVisible, setIsCreateFlyoutVisible] = useState(false);
  const [editingUser, setEditingUser] = useState({});
  const [users, setUsers] = useState([] as User[]);
  const [rolesLoading, roles, rolesError] = useApiService<Role[]>(RolesServices.GetRoles, {});
  const [securityError, setSecurityError] = useState(false);
  const [rolesObject, setRolesObject] = useState({});

  const getUsers = async () => {
    const _users = await UsersServices.GetUsers().catch(error => {
      setUsers([]);
      setSecurityError(true);
    });

    setUsers(_users as User[]);
  };

  useEffect(() => {
    if (!rolesLoading && (roles || []).length) {
      const _rolesObject = (roles || []).reduce(
        (rolesObj, role) => ({ ...rolesObj, [role.id]: role.name }),
        {}
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
  const closeEditFlyout = async refresh => {
    if (refresh) await getUsers();
    setIsEditFlyoutVisible(false);
  };

  const closeCreateFlyout = async (refresh) => {
    if (refresh) await getUsers();
    setIsCreateFlyoutVisible(false);
  };

  if (securityError) {
    return (
      <EuiEmptyPrompt
        iconType="securityApp"
        title={<h2>You need permission to manage users</h2>}
        body={<p>Contact your system administrator.</p>}
      />
    );
  }
  if (isEditFlyoutVisible) {
    editFlyout = (
      <EuiOverlayMask
        headerZindexLocation="below"
        onClick={() => {
          setIsEditFlyoutVisible(false);
        }}
      >
        <EditUser
          currentUser={editingUser}
          closeFlyout={closeEditFlyout}
          rolesObject={rolesObject}
        />
      </EuiOverlayMask>
    );
  }

  if (isCreateFlyoutVisible) {
    createFlyout = (
      <EuiOverlayMask
        headerZindexLocation="below"
        onClick={() => {
          setIsCreateFlyoutVisible(false);
        }}
      >
        <CreateUser closeFlyout={closeCreateFlyout} />
      </EuiOverlayMask>
    );
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
          <div>
            <EuiButton onClick={() => setIsCreateFlyoutVisible(true)}>Create user</EuiButton>
            {createFlyout}
          </div>
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
};
