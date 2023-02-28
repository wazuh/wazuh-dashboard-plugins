import React, { useRef, useState, useEffect } from 'react';
import {
  EuiButton,
  EuiTitle,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiForm,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSpacer,
  EuiBadge,
  EuiComboBox,
  EuiFieldPassword,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiPanel,
} from '@elastic/eui';

import { useApiService } from '../../../common/hooks/useApiService';
import { Role } from '../../roles/types/role.type';
import { UpdateUser, User } from '../types/user.type';
import UsersServices from '../services';
import RolesServices from '../../roles/services';
import { WzButtonPermissions } from '../../../common/permissions/button';
import { ErrorHandler } from '../../../../react-services/error-handler';
import { WzAPIUtils } from '../../../../react-services/wz-api-utils';
import { useDebouncedEffect } from '../../../common/hooks/useDebouncedEffect';
import _ from 'lodash';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { WzFlyout } from '../../../common/flyouts';

export const EditUser = ({ currentUser, closeFlyout, rolesObject }) => {
  const userRolesFormatted =
    currentUser.roles && currentUser.roles.length
      ? currentUser.roles.map((item) => ({ label: rolesObject[item], id: item }))
      : [];
  const [selectedRoles, setSelectedRole] = useState(userRolesFormatted);
  const [rolesLoading, roles, rolesError] = useApiService<Role[]>(RolesServices.GetRoles, {});
  const rolesOptions: any = roles
    ? roles.map((item) => {
        return { label: item.name, id: item.id };
      })
    : [];

  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initialPassword] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [allowRunAs, setAllowRunAs] = useState<boolean>(currentUser.allow_run_as);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({
    password: '',
    confirmPassword: '',
  });
  const [showApply, setShowApply] = useState(false);

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
      let _showApply =
        isValidForm(false) &&
        (allowRunAs !== currentUser.allow_run_as ||
          password !== '' ||
          Object.values(getRolesDiff()).some((i) => i.length));

      setShowApply(_showApply);
    },
    300,
    [password, confirmPassword, allowRunAs, selectedRoles]
  );

  const validations = {
    password: [
      {
        fn: () =>
          password !== '' &&
          !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/)
            ? 'The password must contain a length between 8 and 64 characters, and must contain at least one upper and lower case letter, a number and a symbol.'
            : '',
      },
    ],
    confirmPassword: [{ fn: () => (confirmPassword !== password ? `Passwords don't match.` : '') }],
  };

  const validateFields = (fields, showErrors = true) => {
    const _formErrors = { ...formErrors };
    let isValid = true;
    fields.forEach((field) => {
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

    const userPromises: (Promise<User> | Promise<void>)[] = [];
    const userData: UpdateUser = {};
    const allowRunAsData: boolean = allowRunAs;

    if (allowRunAsData != currentUser.allow_run_as)
      userPromises.push(UsersServices.UpdateAllowRunAs(currentUser.id, allowRunAsData));

    if (password) {
      userData.password = password;
      userPromises.push(UsersServices.UpdateUser(currentUser.id, userData));
    }

    userPromises.push(updateRoles());
    try {
      await Promise.all([userPromises]);

      ErrorHandler.info('User was successfully updated');
      closeFlyout(true);
    } catch (error) {
      const options = {
        context: `${EditUser.name}.editUser`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
      setIsLoading(false);
    }
  };

  const getRolesDiff = () => {
    const formattedRoles = selectedRoles.map((item) => item.id);
    const _userRolesFormatted = userRolesFormatted.map((role) => role.id);
    const toAdd = formattedRoles.filter((value) => !_userRolesFormatted.includes(value));
    const toRemove = _userRolesFormatted.filter((value) => !formattedRoles.includes(value));
    return { toAdd, toRemove };
  };

  const updateRoles = async () => {
    const { toAdd, toRemove } = getRolesDiff();
    if (toAdd.length) await UsersServices.AddUserRoles(currentUser.id, toAdd);
    if (toRemove.length) await UsersServices.RemoveUserRoles(currentUser.id, toRemove);
  };

  const onChangeRoles = (selectedRoles) => {
    setSelectedRole(selectedRoles);
  };

  const onChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const onChangeConfirmPassword = (e) => {
    setConfirmPassword(e.target.value);
  };

  const onChangeAllowRunAs = (e) => {
    setAllowRunAs(e.target.checked);
  };

  let modal;
  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title="Unsubmitted changes"
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
            setHasChanges(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText="No, don't do it"
          confirmButtonText="Yes, do it"
        >
          <p style={{ textAlign: 'center' }}>
            There are unsaved changes. Are you sure you want to proceed?
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  useEffect(() => {
    if (
      initialPassword != password || initialPassword != confirmPassword ||
      !_.isEqual(userRolesFormatted, selectedRoles) || allowRunAs != currentUser.allow_run_as
    ) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [selectedRoles, password, confirmPassword, allowRunAs]);

  const onClose = () => {
    hasChanges ? setIsModalVisible(true) : closeFlyout(false);
  };

  return (
    <>
      <WzFlyout flyoutProps={{ className: 'wzApp' }} onClose={onClose}>
        <EuiFlyoutHeader hasBorder={false}>
          <EuiTitle size="m">
            <h2>
              Edit {currentUser.username} user &nbsp; &nbsp;
              {WzAPIUtils.isReservedID(currentUser.id) && (
                <EuiBadge color="primary">Reserved</EuiBadge>
              )}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiForm component="form" style={{ padding: 24 }}>
            <EuiPanel>
              <EuiTitle size="s">
                <h2>Run as</h2>
              </EuiTitle>
              <EuiFormRow label="" helpText="Set if the user is able to use run as">
                <WzButtonPermissions
                  buttonType="switch"
                  label="Allow run as"
                  showLabel={true}
                  checked={allowRunAs}
                  permissions={[{ action: 'security:edit_run_as', resource: '*:*:*' }]}
                  onChange={(e) => onChangeAllowRunAs(e)}
                  aria-label=""
                  disabled={WzAPIUtils.isReservedID(currentUser.id)}
                />
              </EuiFormRow>
            </EuiPanel>
            <EuiSpacer />
            <EuiPanel>
              <EuiTitle size="s">
                <h2>Password</h2>
              </EuiTitle>
              <EuiFormRow
                label=""
                isInvalid={!!formErrors.password}
                error={formErrors.password}
                helpText="Introduce a new password for the user."
              >
                <EuiFieldPassword
                  placeholder="Password"
                  value={password}
                  onChange={(e) => onChangePassword(e)}
                  aria-label=""
                  isInvalid={!!formErrors.password}
                  disabled={WzAPIUtils.isReservedID(currentUser.id)}
                />
              </EuiFormRow>
              <EuiFormRow
                label=""
                isInvalid={!!formErrors.confirmPassword}
                error={formErrors.confirmPassword}
                helpText="Confirm the new password."
              >
                <EuiFieldPassword
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => onChangeConfirmPassword(e)}
                  aria-label=""
                  isInvalid={!!formErrors.confirmPassword}
                  disabled={WzAPIUtils.isReservedID(currentUser.id)}
                />
              </EuiFormRow>
            </EuiPanel>
            <EuiSpacer />
            <EuiPanel>
              <EuiTitle size="s">
                <h2>Roles</h2>
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
                  isDisabled={WzAPIUtils.isReservedID(currentUser.id)}
                />
              </EuiFormRow>
            </EuiPanel>

            <EuiSpacer />
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiButton
                  fill
                  isLoading={isLoading}
                  isDisabled={WzAPIUtils.isReservedID(currentUser.id) || !showApply}
                  onClick={editUser}
                >
                  Apply
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiForm>
        </EuiFlyoutBody>
      </WzFlyout>
      {modal}
    </>
  );
};
