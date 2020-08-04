import React, { useState } from 'react';
import {
    EuiButton,
    EuiButtonEmpty,
    EuiTitle,
    EuiFlyout,
    EuiOverlayMask,
    EuiFlyoutHeader,
    EuiHorizontalRule,
    EuiFlyoutBody,
    EuiForm,
    EuiFlexGroup,
    EuiFlexItem,
    EuiFieldText,
    EuiConfirmModal,
    EuiFormRow,
    EuiSpacer,
    EuiFieldPassword,
    EuiComboBox
} from '@elastic/eui';

import { WazuhSecurity } from '../../../factories/wazuh-security'
import { useApiRequest } from '../../common/hooks/useApiRequest';
import { AppState } from '../../../react-services/app-state';
import { ErrorHandler } from '../../../react-services/error-handler';


export const EditUser = ({ currentUser, closeFlyout }) => {
    const [wazuhSecurity, setWazuhSecurity] = useState(new WazuhSecurity());
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [fullName, setFullName] = useState(currentUser.full_name);
    const [emailAddress, setEmailAddress] = useState(currentUser.email);
    const userRoles = currentUser.roles ? currentUser.roles.map(item => { return { label: item } }) : [];
    const [selectedRoles, setSelectedRole] = useState(userRoles);
    const [editPassword, setEditPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [passwordConfirmationError, setPasswordConfirmationError] = useState(false);
    const roles = useApiRequest('GET', '/security/roles', {}, (result) => { return ((result || {}).data || {}).data || {}; });
    const rolesOptions = roles.data.affected_items ? roles.data.affected_items.map(item => { return { label: item.name } }) : [];


    const closeModal = () => setIsModalVisible(false);
    const showModal = () => setIsModalVisible(true);


    const editUser = async () => {
        if (editPassword) {
            if (!password || password.length < 6) {
                setPasswordError(true);
                return;
            } else {
                setPasswordError(false);
            }
            if (!passwordConfirmation || passwordConfirmation.length < 6 || passwordConfirmation !== password) {
                setPasswordConfirmationError(true);
                return;
            } else {
                setPasswordConfirmationError(false);
            }
        }

        const currentApi = JSON.parse(AppState.getCurrentAPI()).id;
        const formattedRoles = selectedRoles.map(item => {
            return `wazuh_${currentApi}_${item.label}`
        });
        formattedRoles.push('wazuh_user'); // TODO: documentation should show a guide of adding a role necessary for all wazuh users with minimum permissions

        try {
            if (editPassword) {
                await wazuhSecurity.security.editUser(currentUser.user, { username: currentUser.user, password, roles: formattedRoles, full_name: fullName, email: emailAddress });
            } else {
                await wazuhSecurity.security.editUser(currentUser.user, { username: currentUser.user, roles: formattedRoles, full_name: fullName, email: emailAddress });
            }
            ErrorHandler.info('User was successfully edited', '');
        } catch (error) {
            ErrorHandler.handle(error, 'Error editing user');
        }
        closeFlyout(false)
    }


    const onChangeRoles = selectedRoles => {
        setSelectedRole(selectedRoles);
    };
    const onPasswordChange = e => {
        setPassword(e.target.value);
    }
    const onPasswordConfChange = e => {
        setPasswordConfirmation(e.target.value);
    }
    const onEmailChange = e => {
        setEmailAddress(e.target.value);
    }
    const onFullNameChange = e => {
        setFullName(e.target.value);
    }


    const removeUser = async (confirmed) => {
        if (!confirmed) {
            showModal();
        } else {
            try {
                await wazuhSecurity.security.deleteUser(currentUser.user);
                ErrorHandler.info('User was successfully deleted', '');
            } catch (error) {
                ErrorHandler.handle(error, 'Error deleting user');
            }
            closeFlyout(false)
        }
    };

    let modal;

    if (isModalVisible) {
        modal = (
            <EuiOverlayMask>
                <EuiConfirmModal
                    title={`Delete user ${currentUser.user}`}
                    onCancel={closeModal}
                    onConfirm={async () => { closeModal(); await removeUser(true) }}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete"
                    buttonColor="danger"
                    defaultFocusedButton="confirm">
                    <p>This operation can't be undone</p>
                </EuiConfirmModal>
            </EuiOverlayMask>
        )
    }

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
                    <EuiFormRow label="Full name">
                        <EuiFieldText
                            value={fullName}
                            onChange={e => onFullNameChange(e)}
                            aria-label="Use aria labels when no actual label is in use"
                        />
                    </EuiFormRow>
                    <EuiFormRow label="Email address">
                        <EuiFieldText
                            value={emailAddress}
                            onChange={e => onEmailChange(e)}
                            aria-label="Use aria labels when no actual label is in use"
                        />
                    </EuiFormRow>
                    <EuiFormRow label="Roles"
                        helpText="Assign roles to the user from the roles available in your security plugin.">

                        <EuiComboBox
                            placeholder="Select roles"
                            options={rolesOptions}
                            selectedOptions={selectedRoles}
                            isLoading={roles.isLoading}
                            onChange={onChangeRoles}
                            isClearable={true}
                            data-test-subj="demoComboBox"
                        />
                    </EuiFormRow>
                    {!editPassword &&
                        <EuiButtonEmpty style={{ marginTop: 15 }} size="s" onClick={() => setEditPassword(true)}>
                            Change password
                        </EuiButtonEmpty>
                    }
                    {editPassword &&
                        <>
                            <EuiHorizontalRule margin="xs" />
                            <EuiFormRow label="Password"
                                isInvalid={passwordError}
                                error={'Password must be at least 6 characters'}>
                                <EuiFieldPassword
                                    value={password}
                                    onChange={e => onPasswordChange(e)}
                                    aria-label="Use aria labels when no actual label is in use"
                                />
                            </EuiFormRow>
                            <EuiFormRow label="Password confirmation"
                                isInvalid={passwordConfirmationError}
                                error={'Passwords do not match'}>
                                <EuiFieldPassword
                                    value={passwordConfirmation}
                                    onChange={e => onPasswordConfChange(e)}
                                    aria-label="Use aria labels when no actual label is in use"
                                />
                            </EuiFormRow>
                        </>
                    }

                    <EuiSpacer />
                    <EuiFlexGroup>
                        <EuiFlexItem grow={false}>
                            <EuiButton type="submit" fill onClick={editUser}>
                                Edit user
                            </EuiButton>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                            <EuiButtonEmpty type="submit" fill color="danger" onClick={async () => await removeUser(false)}>
                                Delete user
                            </EuiButtonEmpty>
                        </EuiFlexItem>
                    </EuiFlexGroup>
                </EuiForm>
            </EuiFlyoutBody>
            {modal}
        </EuiFlyout>

    )
};