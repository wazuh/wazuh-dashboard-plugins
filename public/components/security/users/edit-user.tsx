import React, { useState } from 'react';
import {
    EuiButton,
    EuiTitle,
    EuiFlyout,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiForm,
    EuiFlexGroup,
    EuiFlexItem,
    EuiFormRow,
    EuiSpacer,
    EuiBadge,
    EuiComboBox
} from '@elastic/eui';

import { useApiRequest } from '../../common/hooks/useApiRequest';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzRequest } from '../../../react-services/wz-request';

export const EditUser = ({ currentUser, closeFlyout, rolesObject }) => {
    const userRolesFormatted = currentUser.roles && currentUser.roles.length ? currentUser.roles.map(item => { return { label: rolesObject[item], id:item } }) : [];
    const [selectedRoles, setSelectedRole] = useState(userRolesFormatted);
    const [rolesParams, setRoleParams] = useState({});
    const [rolesLoading, roles, rolesError] = useApiRequest('GET', '/security/roles', rolesParams);
    const rolesOptions = roles.affected_items ? roles.affected_items.map(item => { return { label: item.name, id: item.id } }) : [];

    const [rulesParams, setRuleParams] = useState({search: `wui_${currentUser.user}`});
    const [rulesLoading, rules, rulesError] = useApiRequest('GET', '/security/rules', rulesParams);
    var userRules = rules.affected_items ? rules.affected_items.filter(item => {return item.name === `wui_${currentUser.user}`}) : [];
    const [isLoading, setIsLoading] = useState(false);

    const editUser = async () => {
        setIsLoading(true);
        const formattedRoles = selectedRoles.map(item => {
            return item.id;
        });
        if(!userRules.length){
            const data = await WzRequest.apiReq(
                'POST',
                '/security/rules',
                {
                    "name": `wui_${currentUser.user}`,
                    "rule": {
                        "FIND": {
                        "r'user_?name'": `${currentUser.user}`
                        }
                    }
                }
            );
            userRules = ((data.data || {}).data || {}).affected_items || [];
        }
        const ruleId = (userRules[0] || {}).id || false;
        if(ruleId){
            const toAdd = formattedRoles.filter(value => !currentUser.roles.includes(value));
            const toRemove = currentUser.roles.filter(value => !formattedRoles.includes(value));
            await Promise.all(toAdd.map(async (role) => {  
                const data = await WzRequest.apiReq(
                    'POST',
                    `/security/roles/${role}/rules`,
                    {
                        params: {
                            rule_ids: ruleId
                        }
                    }
                );
            }));

            await Promise.all(toRemove.map(async (role) => {  
                const data = await WzRequest.apiReq(
                    'DELETE',
                    `/security/roles/${role}/rules`,
                    {
                        params: {
                            rule_ids: ruleId
                        }
                    }
                );
            }));
        }
        closeFlyout(false)
    }


    const onChangeRoles = selectedRoles => {
        setSelectedRole(selectedRoles);
    };



    return (

        <EuiFlyout
            onClose={() => closeFlyout()}>
            <EuiFlyoutHeader hasBorder={false}>
                <EuiTitle size="m">
                    <h2>Edit {currentUser.user} user &nbsp; &nbsp;
                    {currentUser.user === 'elastic' || currentUser.user === 'admin' &&
                            <EuiBadge color='primary'>Reserved</EuiBadge>
                        }</h2>
                </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody>
                <EuiForm component="form" style={{ padding: 24 }}>
                    <EuiFormRow label="Roles"
                        helpText="Assign roles to the selected user">

                        <EuiComboBox
                            placeholder="Select roles"
                            options={rolesOptions}
                            selectedOptions={selectedRoles}
                            isLoading={rulesLoading || isLoading}
                            onChange={onChangeRoles}
                            isClearable={true}
                            data-test-subj="demoComboBox"
                        />
                    </EuiFormRow>
                    <EuiSpacer />
                    <EuiFlexGroup>
                        <EuiFlexItem grow={false}>
                            <EuiButton fill isLoading={isLoading} isDisabled={currentUser.user === 'elastic' || currentUser.user === 'admin'} onClick={editUser}>
                                Apply
                            </EuiButton>
                        </EuiFlexItem>
                    </EuiFlexGroup>
                </EuiForm>
            </EuiFlyoutBody>
        </EuiFlyout>

    )
};