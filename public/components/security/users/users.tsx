
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
import { EditUser } from './edit-user';
import { ApiRequest } from '../../../react-services/api-request';

export const Users = ({setSecurityError}) => {
    const [isEditFlyoutVisible, setIsEditFlyoutVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(false);
    const [users,setUsers] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [relationUserRole, setRelationUserRole] = useState({});
    const [roles, setRoles] = useState({});
    const getUsers = async() => {
        const loadRoles = async(users) => {
            const rolesData = await ApiRequest.request(
                'GET',
                '/security/roles',
                { }
            );
            const roles =  ((rolesData.data || {}).data || {}).affected_items || [];
            const rolesObject = {};
            roles.forEach(item => {
                rolesObject[item.id] = item.name;
            });
            setRoles(rolesObject);

            const rulesData = await ApiRequest.request(
                'GET',
                '/security/rules',
                { }
            );
            const rules =  ((rulesData.data || {}).data || {}).affected_items || [];
            const userRelationRole = {}
            users.forEach(item => {
                const filteredRule = rules.filter(x => x.name === `wui_${item.user}` || item.user === 'elastic');
                if(filteredRule.length){
                    userRelationRole[item.user] = filteredRule[0].roles;
                }
            });
            setRelationUserRole(userRelationRole);
            setRolesLoading(false);

        }
        try{
            const wazuhSecurity = new WazuhSecurity();
            const wazuh_users = await wazuhSecurity.security.getUsers();
            const users = wazuh_users.map((item,idx) => {
                return {id: idx, user: item.username, roles: [], full_name: item.full_name, email: item.email}
            });
            setUsers(users);
            loadRoles(users);
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
                <EditUser currentUser={editingUser} closeFlyout={closeEditFlyout} userRoles={relationUserRole[editingUser.user] || []} rolesObject={roles}/>
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
                <UsersTable users={users} editUserFlyover={showEditFlyover} rolesLoading={rolesLoading} relationUserRole={relationUserRole} roles={roles}></UsersTable>
            </EuiPageContentBody>
            {editFlyout}
        </EuiPageContent>
    );
};