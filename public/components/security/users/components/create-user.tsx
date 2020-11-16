import React, { useEffect, useRef, useState } from 'react';
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
  EuiPanel,
} from '@elastic/eui';

import { useApiService } from '../../../common/hooks/useApiService';
import { Role } from '../../roles/types/role.type';
import { CreateUser as TCreateUser } from '../types/user.type';
import UsersServices from '../services';
import RolesServices from '../../roles/services';
import { ErrorHandler } from '../../../../react-services/error-handler';
import { useDebouncedEffect } from '../../../common/hooks/useDebouncedEffect';

export const CreateUser = ({ closeFlyout }) => {
  const [selectedRoles, setSelectedRole] = useState<any>([]);
  const [rolesLoading, roles, rolesError] = useApiService<Role[]>(RolesServices.GetRoles, {});
  const rolesOptions: any = roles
    ? roles.map(item => {
        return { label: item.name, id: item.id };
      })
    : [];

  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [allowRunAs, setAllowRunAs] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<any>({
    userName: '',
    password: '',
    confirmPassword: '',
  });
  const [showApply, setShowApply] = useState(false);

  const userNameRef = useRef(false);
  useDebouncedEffect(
    () => {
      if (userNameRef.current) validateFields(['userName']);
      else userNameRef.current = true;
    },
    300,
    [userName]
  );

  const passwordRef = useRef(false);
  useDebouncedEffect(
    () => {
      if (passwordRef.current) validateFields(['password', 'confirmPassword']);
      else passwordRef.current = true;
    },
    300,
    [password]
  );

  const confirmPasswordRef = useRef(false);
  useDebouncedEffect(
    () => {
      if (confirmPasswordRef.current) validateFields(['confirmPassword']);
      else confirmPasswordRef.current = true;
    },
    300,
    [confirmPassword]
  );

  useDebouncedEffect(
    () => {
      setShowApply(isValidForm(false));
    },
    300,
    [userName, password, confirmPassword]
  );

  const validations = {
    userName: [
      { fn: () => (userName.trim() === '' ? 'The user name is required' : '') },
      {
        fn: () =>
          !userName.match(/^.{4,20}$/)
            ? 'The user name must contain a length between 4 and 20 characters.'
            : '',
      },
    ],
    password: [
      { fn: () => (password === '' ? 'The password is required' : '') },
      {
        fn: () =>
          !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/)
            ? 'The password must contain a length between 8 and 64 characters, and must contain at least one upper and lower case letter, a number and a symbol.'
            : '',
      },
    ],
    confirmPassword: [
      { fn: () => (confirmPassword === '' ? 'The confirm password is required' : '') },
      { fn: () => (confirmPassword !== password ? `Passwords don't match.` : '') },
    ],
  };

  const validateFields = (fields, showErrors = true) => {
    const _formErrors = { ...formErrors };
    let isValid = true;
    fields.forEach(field => {
      const error = validations[field].reduce((currentError, validation) => {
        return !!currentError ? currentError : validation.fn();
      }, '');
      _formErrors[field] = error;
      isValid = isValid && !!!error;
    });
    if (showErrors) setFormErrors(_formErrors);
    return isValid;
  };

  const isValidForm = (showErrors = true) => {
    return validateFields(Object.keys(validations), showErrors);
  };

  const editUser = async () => {
    if (!isValidForm()) {
      ErrorHandler.warning('Please resolve the incorrect fields.');
      return;
    }

    setIsLoading(true);

    const userData: TCreateUser = {
      username: userName,
      password: password,
      allow_run_as: allowRunAs,
    };

    try {
      const user = await UsersServices.CreateUser(userData);
      await addRoles(user.id);

      ErrorHandler.info('User was successfully created');
      closeFlyout(true);
    } catch (error) {
      ErrorHandler.handle(error, 'There was an error');
      setIsLoading(false);
    }
  };

  const addRoles = async userId => {
    const formattedRoles = selectedRoles.map(item => {
      return item.id;
    });
    if (formattedRoles.length > 0) await UsersServices.AddUserRoles(userId, formattedRoles);
  };

  const onChangeRoles = selectedRoles => {
    setSelectedRole(selectedRoles);
  };

  const onChangeUserName = e => {
    setUserName(e.target.value);
  };

  const onChangePassword = e => {
    setPassword(e.target.value);
  };

  const onChangeConfirmPassword = e => {
    setConfirmPassword(e.target.value);
  };

  const onChangeAllowRunAs = e => {
    setAllowRunAs(e.target.checked);
  };

  return (
    <EuiFlyout onClose={() => closeFlyout()}>
      <EuiFlyoutHeader hasBorder={false}>
        <EuiTitle size="m">
          <h2>Create new user</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiForm component="form" style={{ padding: 24 }}>
          <EuiPanel>
            <EuiTitle size="s">
              <h2>User data</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiFormRow
              label="User name"
              isInvalid={!!formErrors.userName}
              error={formErrors.userName}
              helpText="Introduce the user name for the user."
            >
              <EuiFieldText
                placeholder="User name"
                value={userName}
                onChange={e => onChangeUserName(e)}
                aria-label=""
                isInvalid={!!formErrors.userName}
              />
            </EuiFormRow>
            <EuiFormRow
              label="Password"
              isInvalid={!!formErrors.password}
              error={formErrors.password}
              helpText="Introduce a new password for the user."
            >
              <EuiFieldPassword
                placeholder="Password"
                value={password}
                onChange={e => onChangePassword(e)}
                aria-label=""
                isInvalid={!!formErrors.password}
              />
            </EuiFormRow>
            <EuiFormRow
              label="Confirm Password"
              isInvalid={!!formErrors.confirmPassword}
              error={formErrors.confirmPassword}
              helpText="Confirm the new password."
            >
              <EuiFieldPassword
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => onChangeConfirmPassword(e)}
                aria-label=""
                isInvalid={!!formErrors.confirmPassword}
              />
            </EuiFormRow>
            <EuiFormRow label="Allow run as" helpText="Set if the user is able to use run as">
              <EuiSwitch
                label="Allow run as"
                showLabel={false}
                checked={allowRunAs}
                onChange={e => onChangeAllowRunAs(e)}
                aria-label=""
              />
            </EuiFormRow>
          </EuiPanel>
          <EuiSpacer />
          <EuiPanel>
            <EuiTitle size="s">
              <h2>User roles</h2>
            </EuiTitle>
            <EuiFormRow label="" helpText="Assign roles to the selected user">
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
          </EuiPanel>
          <EuiSpacer />
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiButton fill isLoading={isLoading} onClick={editUser} isDisabled={!showApply}>
                Apply
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiForm>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
