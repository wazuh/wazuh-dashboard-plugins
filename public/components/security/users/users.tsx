
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
import {useApiRequest} from '../../common/hooks/useApiRequest';
import { CreateUser } from './create-user';
import { AppState } from '../../../react-services/app-state'
import { EditUser } from './edit-user';
import { ErrorHandler } from '../../../react-services/error-handler';

export const Users = ({setSecurityError}) => {
    const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
    const [isEditFlyoutVisible, setIsEditFlyoutVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(false);
    const [users,setUsers] = useState([]);
    const getUsers = async() => {
        try{
            const currentApi = JSON.parse(AppState.getCurrentAPI()).id;
            const wazuhSecurity = new WazuhSecurity();
            const response = await wazuhSecurity.security.getUsers();
            // Filter by users with the role "wazuh_user"
            const wazuh_users = response.filter(item => { 
                return item.roles.includes('wazuh_user')
            });
            // Show only roles that starts with "wazuh_<currentAPI>"
            const users = wazuh_users.map((item,idx) => {
                const filteredRoles = item.roles.filter(role => {
                    return role.startsWith(`wazuh_${currentApi}_`);
                }).map(item => {return item.replace(`wazuh_${currentApi}_`,"")});
                return {id: idx, user: item.username, roles: filteredRoles, full_name: item.full_name, email: item.email}
            });
            setUsers(users)
        }catch(error){
            setSecurityError(true);
        }
    }
    useEffect(() => {
        getUsers();
      }, []);



    const closeFlyout = async() => {
        setIsFlyoutVisible(false);
        await getUsers();
    };

    let flyout;
    if (isFlyoutVisible) {
        flyout = (
            <EuiOverlayMask onClick={(e) => {
                e.target.className === 'euiOverlayMask' &&
                    setIsFlyoutVisible(false)
            }}>
                <CreateUser closeFlyout={closeFlyout}/> 
            </EuiOverlayMask >
        );
    }
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
                    <div>
                        <EuiButton
                            onClick={() => setIsFlyoutVisible(true)}>
                            Create user
                                </EuiButton>
                        {flyout}
                        {editFlyout}
                    </div>
                </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiPageContentBody>
                <UsersTable users={users} editUserFlyover={showEditFlyover}></UsersTable>
            </EuiPageContentBody>
        </EuiPageContent>
    );
};