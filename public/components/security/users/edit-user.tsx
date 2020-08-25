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
    EuiComboBox
} from '@elastic/eui';

import { useApiRequest } from '../../common/hooks/useApiRequest';
import { ErrorHandler } from '../../../react-services/error-handler';


export const EditUser = ({ currentUser, closeFlyout }) => {
    const userRoles = currentUser.roles ? currentUser.roles.map(item => { return { label: item } }) : [];
    const [selectedRoles, setSelectedRole] = useState(userRoles);
    const [loading, data, error] = useApiRequest('GET', '/security/roles', {});
    const rolesOptions = data.affected_items ? data.affected_items.map(item => { return { label: item.name } }) : [];




    const editUser = async () => {
        const formattedRoles = selectedRoles.map(item => {
            return item.label;
        });
        
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
                    <h2>Edit {currentUser.user} user</h2>
                </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody>
                <EuiForm component="form" style={{ padding: 24 }}>
                    <EuiFormRow label="Roles"
                        helpText="Assign roles to the user from the roles available in your security plugin.">

                        <EuiComboBox
                            placeholder="Select roles"
                            options={rolesOptions}
                            selectedOptions={selectedRoles}
                            isLoading={loading}
                            onChange={onChangeRoles}
                            isClearable={true}
                            data-test-subj="demoComboBox"
                        />
                    </EuiFormRow>
                    <EuiSpacer />
                    <EuiFlexGroup>
                        <EuiFlexItem grow={false}>
                            <EuiButton fill onClick={editUser}>
                                Apply
                            </EuiButton>
                        </EuiFlexItem>
                    </EuiFlexGroup>
                </EuiForm>
            </EuiFlyoutBody>
        </EuiFlyout>

    )
};