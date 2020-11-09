import React, { useEffect, useState } from 'react';
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
    EuiComboBox,
    EuiSwitch,
    EuiFieldPassword,
    EuiText,
    EuiFieldText,
} from '@elastic/eui';

import { useApiService } from '../../../components/common/hooks/useApiService';
import { Role } from '../roles/types/role.type';
import { CreateUser as TCreateUser } from './types/user.type';
import UsersServices from './services';
import RolesServices from '../roles/services';
import { ErrorHandler } from '../../../react-services/error-handler';


export const CreateUser = ({ closeFlyout }) => {
    const [selectedRoles, setSelectedRole] = useState<any>([]);
    const [rolesLoading, roles, rolesError] = useApiService<Role[]>(RolesServices.GetRoles, {});
    const rolesOptions = roles ? roles.map(item => { return { label: item.name, id: item.id } }) : [];

    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState('');
    const [userNameError, setUserNameError] = useState<null | string>(null);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState<null | string>(null);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState<null | string>(null);
    const [allowRunAs, setAllowRunAs] = useState<boolean>(false);

    useEffect(() => {
        let error: null | string = null;
        if (userName.length > 0 && !userName.match(/^.{4,20}$/)) {
            error = 'The user name must contain a length between 4 and 20 characters.';
        }
        setUserNameError(error);
    }, [userName]);

    useEffect(() => {
        let error: null | string = null;
        if (password.length > 0 && !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/)) {
            error = 'The password must contain a length between 8 and 64 characters, and must contain at least one upper and lower case letter, a number and a symbol.';
        }
        setPasswordError(error);
    }, [password]);

    useEffect(() => {
        let error: null | string = null;
        if ((password.length > 0 || confirmPassword.length > 0) && password !== confirmPassword) {
            error = `Passwords don't match.`
        }
        setConfirmPasswordError(error);
    }, [confirmPassword, password]);

    const addRoles = async (userId) => {
        const formattedRoles = selectedRoles.map(item => {
            return item.id;
        });
        if (formattedRoles.length > 0)
            await UsersServices.AddUserRoles(userId, formattedRoles);
    };

    const isValidForm = () => {
        let error = false;
        error = !!(userName === '')
        error = error || (password === '' || confirmPassword === '');
        return !error;
    };

    const editUser = async () => {
        if (!isValidForm()) {
            ErrorHandler.warning("Please resolve the incorrect fields.");
            return;
        }

        setIsLoading(true);

        const userData: TCreateUser = {
            username: userName,
            password: password,
            allow_run_as: allowRunAs
        };

        try {
            const user = await UsersServices.CreateUser(userData)
            await addRoles(user.id);

            ErrorHandler.info('User was successfully created');
            closeFlyout(false)
        } catch (error) {
            ErrorHandler.handle(error, "There was an error");
            setIsLoading(false);
        }
    };

    const onChangeRoles = selectedRoles => {
        setSelectedRole(selectedRoles);
    };

    const onChangeUserName = e => {
        setUserName(e.target.value);
    }

    const onChangePassword = e => {
        setPassword(e.target.value);
    }

    const onChangeConfirmPassword = e => {
        setConfirmPassword(e.target.value);
    }

    const onChangeAllowRunAs = e => {
        setAllowRunAs(e.target.checked);
    }

    return (

        <EuiFlyout
            onClose={() => closeFlyout()}>
            <EuiFlyoutHeader hasBorder={false}>
                <EuiTitle size="m">
                    <h2>Create new user</h2>
                </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody>
                <EuiForm component="form" style={{ padding: 24 }}>
                    <EuiFormRow label="User name"
                        isInvalid={!!userNameError}
                        error={userNameError}
                        helpText="Introduce a the user name for the user.">
                        <EuiFieldText
                            placeholder="User name"
                            value={userName}
                            onChange={e => onChangeUserName(e)}
                            aria-label=""
                            isInvalid={!!userNameError}
                            required
                        />
                    </EuiFormRow>
                    <EuiFormRow label="Password"
                        isInvalid={!!passwordError}
                        error={passwordError}
                        helpText="Introduce a new password for the user.">
                        <EuiFieldPassword
                            placeholder="Password"
                            value={password}
                            onChange={e => onChangePassword(e)}
                            aria-label=""
                            isInvalid={!!passwordError}
                            required
                        />
                    </EuiFormRow>
                    <EuiFormRow label="Confirm Password"
                        isInvalid={!!confirmPasswordError}
                        error={confirmPasswordError}
                        helpText="Confirm the new password.">
                        <EuiFieldPassword
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={e => onChangeConfirmPassword(e)}
                            aria-label=""
                            isInvalid={!!confirmPasswordError}
                            required
                        />
                    </EuiFormRow>
                    <EuiFormRow label="Allow run as"
                        helpText="Set if the user is able to use run as">
                        <EuiSwitch
                            label="Allow run as"
                            showLabel={false}
                            checked={allowRunAs}
                            onChange={e => onChangeAllowRunAs(e)}
                            aria-label=""
                        />
                    </EuiFormRow>
                    <EuiFormRow label="Roles"
                        helpText="Assign roles to the selected user">
                        <EuiComboBox
                            placeholder="Select roles"
                            options={rolesOptions}
                            selectedOptions={selectedRoles}
                            isLoading={rolesLoading || isLoading}
                            onChange={onChangeRoles}
                            isClearable={true}
                            data-test-subj="demoComboBox"
                        />
                    </EuiFormRow>
                    <EuiSpacer />
                    <EuiFlexGroup>
                        <EuiFlexItem grow={false}>
                            <EuiButton fill isLoading={isLoading} onClick={editUser}>
                                Apply
                            </EuiButton>
                        </EuiFlexItem>
                    </EuiFlexGroup>
                </EuiForm>
            </EuiFlyoutBody>
        </EuiFlyout>

    )
};