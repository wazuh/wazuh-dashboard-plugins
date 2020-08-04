import React, { useState } from 'react';
import {
    EuiButton,
    EuiTitle,
    EuiFlyout,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiForm,
    EuiFieldText,
    EuiFormRow,
    EuiSpacer,
    EuiFieldPassword,
    EuiComboBox
} from '@elastic/eui';

import { WazuhSecurity } from '../../../factories/wazuh-security'
import { useApiRequest } from '../../common/hooks/useApiRequest';
import { AppState } from '../../../react-services/app-state';
import { ErrorHandler } from '../../../react-services/error-handler';



export const CreateUser = ({ closeFlyout }) => {
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [selectedRoles, setSelectedRole] = useState([]);
    const [usernameError, setUsernameError] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [passwordConfirmationError, setPasswordConfirmationError] = useState(false);
    const roles = useApiRequest('GET', '/security/roles', {}, (result) => { return ((result || {}).data || {}).data || {}; });

    const rolesOptions = roles.data.affected_items ? roles.data.affected_items.map(item => { return { label: item.name } }) : [];

    const onTextChange = (e) => {
        setUsername(e.target.value);
    }

    const createUser = async () => {
        if (!username) {
            setUsernameError(true);
            return;
        } else {
            setUsernameError(false);
        }
        if (!password || password.length < 6) {
            setPasswordError(true);
            return;
        } else {
            setPasswordError(false);
        }
        if (!passwordConfirmation || passwordConfirmation.length < 6  || passwordConfirmation !== password) {
            setPasswordConfirmationError(true);
            return;
        } else {
            setPasswordConfirmationError(false);
        }

        const currentApi = JSON.parse(AppState.getCurrentAPI()).id;
        const formattedRoles = selectedRoles.map(item => {
            return `wazuh_${currentApi}_${item.label}`
        });
        formattedRoles.push('wazuh_user'); // TODO: documentation should show a guide of adding a role necessary for all wazuh users with minimum permissions

        try {
            const wazuhSecurity = new WazuhSecurity();
            await wazuhSecurity.security.createUser(username, { username, password, roles: formattedRoles, full_name: fullName, email: emailAddress });
            ErrorHandler.info('User was successfully created', '');
        } catch (error) {
            ErrorHandler.handle(error, 'Error creating user');
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

    return (
        <EuiFlyout
            onClose={() => closeFlyout(false)}>
            <EuiFlyoutHeader hasBorder={false}>
                <EuiTitle size="m">
                    <h2>New user</h2>
                </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody><EuiForm component="form" style={{ padding: 24 }}>
                <EuiFormRow label="Username"
                    isInvalid={usernameError}
                    error={"Username field can't be empty"}>

                    <EuiFieldText
                        value={username}
                        onChange={e => onTextChange(e)}
                        aria-label="Use aria labels when no actual label is in use"
                    />
                </EuiFormRow>

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
                <EuiSpacer />
                <EuiButton type="submit" fill onClick={createUser}>
                    Create user
                </EuiButton>
            </EuiForm>
            </EuiFlyoutBody>
        </EuiFlyout>

    )
};