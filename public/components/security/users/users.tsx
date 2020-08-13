
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
import { UsersTable } from './users-table';

import {WazuhSecurity} from '../../../factories/wazuh-security'
import { AppState } from '../../../react-services/app-state'
import { EditUser } from './edit-user';

export const Users = ({setSecurityError}) => {
    const [isEditFlyoutVisible, setIsEditFlyoutVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(false);
    const [users,setUsers] = useState([]);
    const getUsers = async() => {
        try{
            const wazuhSecurity = new WazuhSecurity();
            const wazuh_users = await wazuhSecurity.security.getUsers();
            const users = wazuh_users.map((item,idx) => {
                return {id: idx, user: item.username, roles: [], full_name: item.full_name, email: item.email}
            });
            setUsers(users)
        }catch(error){
            setSecurityError(true);
        }
    }
    useEffect(() => {
        getUsers();
      }, []);

  
    let editFlyout;
    const closeEditFlyout = async() => {
        await getUsers();
        setIsEditFlyoutVisible(false);
    }
    if (isEditFlyoutVisible) {
        editFlyout = (
            <EuiOverlayMask onClick={(e) => {
                e.target.className === 'euiOverlayMask' &&
                    setIsEditFlyoutVisible(false)
            }}>
                <EditUser currentUser={editingUser} closeFlyout={closeEditFlyout} />
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
                </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiPageContentBody>
                <UsersTable users={users} editUserFlyover={showEditFlyover}></UsersTable>
            </EuiPageContentBody>
            {editFlyout}
        </EuiPageContent>
    );
};