
import React, { useState } from 'react';
import {
    EuiPageContent,
    EuiPageContentHeader,
    EuiPageContentHeaderSection,
    EuiPageContentBody,
    EuiButton,
    EuiTitle,
    EuiFlyout,
    EuiOverlayMask,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiForm,
    EuiFormRow,
    EuiSpacer,
    EuiSuperSelect,
    EuiComboBox
} from '@elastic/eui';
import { UsersTable } from './users-table';

export const Users = () => {
    const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);

    const usersOptions = [
        {
            value: 'wazuh',
            inputDisplay: 'wazuh'
        },
        {
            value: 'other',
            inputDisplay: 'other'
        },
    ];

    const [userValue, setUserValue] = useState();

    const onUserValueChange = value => {
        setUserValue(value);
    };

    const rolesOptions = [
        {
            label: 'Admin'
        },
        {
            label: 'Read',
        },
        {
            label: 'Viewer',
        },
        {
            label: 'Wazuh',
        }
    ];

    const [selectedRoles, setSelectedRole] = useState([]);

    const onChangeRoles = selectedRoles => {
        setSelectedRole(selectedRoles);
    };

    let flyout;
    if (isFlyoutVisible) {
        flyout = (
            <EuiOverlayMask onClick={(e) => {
                e.target.className === 'euiOverlayMask' &&
                    setIsFlyoutVisible(false)
            }}>
                <EuiFlyout
                    onClose={() => setIsFlyoutVisible(false)}>
                    <EuiFlyoutHeader hasBorder={false}>
                        <EuiTitle size="m">
                            <h2>New user</h2>
                        </EuiTitle>
                    </EuiFlyoutHeader>
                    <EuiFlyoutBody>
                        <EuiForm component="form" style={{ padding: 24 }}>
                            <EuiFormRow label="Select a user"
                                helpText="Select a user from the users available in your security plugin.">
                                <EuiSuperSelect
                                    options={usersOptions}
                                    valueOfSelected={userValue}
                                    onChange={value => onUserValueChange(value)}
                                />
                            </EuiFormRow>
                            <EuiFormRow label="Roles"
                                helpText="Assign roles to the user from the roles available in your security plugin.">
                                <EuiComboBox
                                    placeholder="Select roles"
                                    options={rolesOptions}
                                    selectedOptions={selectedRoles}
                                    onChange={onChangeRoles}
                                    isClearable={true}
                                    data-test-subj="demoComboBox"
                                />
                            </EuiFormRow>
                            <EuiSpacer />
                            <EuiButton type="submit" fill>
                                Create user
                                    </EuiButton>
                        </EuiForm>
                    </EuiFlyoutBody>
                </EuiFlyout>
            </EuiOverlayMask >
        );
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
                    </div>
                </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiPageContentBody>
                <UsersTable></UsersTable>
            </EuiPageContentBody>
        </EuiPageContent>
    );
};