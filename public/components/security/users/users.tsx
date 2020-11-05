
import React, { useState, useEffect } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiButton,
  EuiTitle,
  EuiOverlayMask,
  EuiEmptyPrompt
} from '@elastic/eui';
import { UsersTable } from './users-table';

import { WazuhSecurity } from '../../../factories/wazuh-security'
import { EditUser } from './edit-user';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withGuard } from '../../common/hocs';
import { PromptNoSecurityPluginUsers } from './prompt-no-security-plugin';
import UsersServices from './services';
import RolesServices from '../roles/services';
import RulesServices from '../rules/services';
import { IUser } from './interfaces/user.interface';

const mapStateToProps = state => ({ currentPlatform: state.appStateReducers.currentPlatform });

export const Users = compose(
  connect(mapStateToProps),
  withGuard(
    (props) => {
      return props.currentPlatform === 'elastic';
    },
    PromptNoSecurityPluginUsers
  )
)(() => {
  const [isEditFlyoutVisible, setIsEditFlyoutVisible] = useState(false);
  const [isCreateFlyoutVisible, setIsCreateFlyoutVisible] = useState(false);
  const [editingUser, setEditingUser] = useState({});
  const [users, setUsers] = useState(Array<any>());
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roles, setRoles] = useState({});
  const [securityError, setSecurityError] = useState(false);

  const loadRoles = async () => {
    const roles = await RolesServices.GetRoles();
    const rolesObject = roles.reduce((rolesObj, role) => ({ ...rolesObj, [role.id]: role.name }), {});
    setRoles(rolesObject);
    setRolesLoading(false);
  }

  const getUsers = async () => {
    try {
      const users = await UsersServices.GetUsers();
      setUsers(users);
      loadRoles();
    } catch (error) {
      setSecurityError(true);
    }
  }

  useEffect(() => {
    getUsers();
  }, []);


  let editFlyout, createFlyout;
  const closeEditFlyout = async () => {
    await getUsers();
    setIsEditFlyoutVisible(false);
  }

  const closeCreateFlyout = async () => {
    await getUsers();
    setIsCreateFlyoutVisible(false);
  }

  if (securityError) {
    return <EuiEmptyPrompt
      iconType="securityApp"
      title={<h2>You need permission to manage users</h2>}
      body={
        <p>Contact your system administrator.</p>
      }
    />
  }
  if (isEditFlyoutVisible) {
    editFlyout = (
      <EuiOverlayMask
        headerZindexLocation="below"
        onClick={() => { setIsEditFlyoutVisible(false) }}>
        <EditUser currentUser={editingUser} closeFlyout={closeEditFlyout} rolesObject={roles} />
      </EuiOverlayMask >
    );
  }

  if (isCreateFlyoutVisible) {
    editFlyout = (
      <EuiOverlayMask
        headerZindexLocation="below"
        onClick={() => { setIsCreateFlyoutVisible(false) }}>
        <EditUser currentUser={editingUser} closeFlyout={closeCreateFlyout} rolesObject={roles} />
      </EuiOverlayMask >
    );
  }

  const showEditFlyover = (item) => {
    setEditingUser(item);
    setIsEditFlyoutVisible(true);
  }

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
            <EuiButton
              onClick={() => setIsCreateFlyoutVisible(true)}>
              Create user
            </EuiButton>
            {createFlyout}
          </div>
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        <UsersTable users={users} editUserFlyover={showEditFlyover} rolesLoading={rolesLoading} roles={roles}></UsersTable>
      </EuiPageContentBody>
      {editFlyout}
    </EuiPageContent>
  );
});