import React, { useRef, useState, useEffect } from 'react';
import {
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
import { i18n } from '@osd/i18n';

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
      ? currentUser.roles.map(item => ({ label: rolesObject[item], id: item }))
      : [];
  const [selectedRoles, setSelectedRole] = useState(userRolesFormatted);
  const [rolesLoading, roles, rolesError] = useApiService<Role[]>(
    RolesServices.GetRoles,
    {},
  );
  const rolesOptions: any = roles
    ? roles.map(item => {
        return { label: item.name, id: item.id };
      })
    : [];

  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initialPassword] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [allowRunAs, setAllowRunAs] = useState<boolean>(
    currentUser.allow_run_as,
  );
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
    [password],
  );

  const confirmPasswordRef = useRef(false);
  useDebouncedEffect(
    () => {
      if (confirmPasswordRef.current) validateFields(['confirmPassword']);
      else confirmPasswordRef.current = true;
    },
    300,
    [confirmPassword],
  );

  useDebouncedEffect(
    () => {
      let _showApply =
        isValidForm(false) &&
        (allowRunAs !== currentUser.allow_run_as ||
          password !== '' ||
          Object.values(getRolesDiff()).some(i => i.length));

      setShowApply(_showApply);
    },
    300,
    [password, confirmPassword, allowRunAs, selectedRoles],
  );

  const validations = {
    password: [
      {
        fn: () =>
          password !== '' &&
          !password.match(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,64}$/,
          )
            ? i18n.translate(
                'wazuh.security.editUser.validation.passwordComplexity',
                {
                  defaultMessage:
                    'The password must contain a length between 12 and 64 characters, and must contain at least one upper and lower case letter, a number and a symbol.',
                },
              )
            : '',
      },
    ],
    confirmPassword: [
      {
        fn: () =>
          confirmPassword !== password
            ? i18n.translate(
                'wazuh.security.editUser.validation.passwordsMismatch',
                { defaultMessage: "Passwords don't match." },
              )
            : '',
      },
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
      ErrorHandler.warning(
        i18n.translate('wazuh.security.editUser.invalidFormWarning', {
          defaultMessage: 'Please resolve the incorrect fields.',
        }),
      );
      return;
    }

    setIsLoading(true);

    const userPromises: (Promise<User> | Promise<void>)[] = [];
    const userData: UpdateUser = {};
    const allowRunAsData: boolean = allowRunAs;

    if (allowRunAsData != currentUser.allow_run_as)
      userPromises.push(
        UsersServices.UpdateAllowRunAs(currentUser.id, allowRunAsData),
      );

    if (password) {
      userData.password = password;
      userPromises.push(UsersServices.UpdateUser(currentUser.id, userData));
    }

    userPromises.push(updateRoles());
    try {
      await Promise.all([userPromises]);

      ErrorHandler.info(
        i18n.translate('wazuh.security.editUser.updateSuccess', {
          defaultMessage: 'User was successfully updated',
        }),
      );
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
    const formattedRoles = selectedRoles.map(item => item.id);
    const _userRolesFormatted = userRolesFormatted.map(role => role.id);
    const toAdd = formattedRoles.filter(
      value => !_userRolesFormatted.includes(value),
    );
    const toRemove = _userRolesFormatted.filter(
      value => !formattedRoles.includes(value),
    );
    return { toAdd, toRemove };
  };

  const updateRoles = async () => {
    const { toAdd, toRemove } = getRolesDiff();
    if (toAdd.length) await UsersServices.AddUserRoles(currentUser.id, toAdd);
    if (toRemove.length)
      await UsersServices.RemoveUserRoles(currentUser.id, toRemove);
  };

  const onChangeRoles = selectedRoles => {
    setSelectedRole(selectedRoles);
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

  let modal;
  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={i18n.translate(
            'wazuh.security.editUser.unsavedChangesModal.title',
            { defaultMessage: 'Unsubmitted changes' },
          )}
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
            setHasChanges(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText={i18n.translate(
            'wazuh.security.editUser.unsavedChangesModal.cancelButton',
            { defaultMessage: "No, don't do it" },
          )}
          confirmButtonText={i18n.translate(
            'wazuh.security.editUser.unsavedChangesModal.confirmButton',
            { defaultMessage: 'Yes, do it' },
          )}
        >
          <p style={{ textAlign: 'center' }}>
            {i18n.translate(
              'wazuh.security.editUser.unsavedChangesModal.body',
              {
                defaultMessage:
                  'There are unsaved changes. Are you sure you want to proceed?',
              },
            )}
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  useEffect(() => {
    if (
      initialPassword != password ||
      initialPassword != confirmPassword ||
      !_.isEqual(userRolesFormatted, selectedRoles) ||
      allowRunAs != currentUser.allow_run_as
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
          <EuiTitle size='m'>
            <h2>
              {i18n.translate('wazuh.security.editUser.title', {
                defaultMessage: 'Edit {username} user',
                values: { username: currentUser.username },
              })}{' '}
              &nbsp; &nbsp;
              {WzAPIUtils.isReservedID(currentUser.id) && (
                <EuiBadge color='primary'>
                  {i18n.translate('wazuh.security.editUser.reservedBadge', {
                    defaultMessage: 'Reserved',
                  })}
                </EuiBadge>
              )}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiForm component='form' style={{ padding: 24 }}>
            <EuiPanel>
              <EuiTitle size='s'>
                <h2>
                  {i18n.translate('wazuh.security.editUser.runAsTitle', {
                    defaultMessage: 'Run as',
                  })}
                </h2>
              </EuiTitle>
              <EuiFormRow
                label=''
                helpText={i18n.translate(
                  'wazuh.security.editUser.allowRunAsHelpText',
                  { defaultMessage: 'Set if the user is able to use run as' },
                )}
              >
                <WzButtonPermissions
                  buttonType='switch'
                  label={i18n.translate(
                    'wazuh.security.editUser.allowRunAsSwitchLabel',
                    { defaultMessage: 'Allow run as' },
                  )}
                  showLabel={true}
                  checked={allowRunAs}
                  permissions={[
                    { action: 'security:edit_run_as', resource: '*:*:*' },
                  ]}
                  onChange={e => onChangeAllowRunAs(e)}
                  aria-label=''
                  disabled={WzAPIUtils.isReservedID(currentUser.id)}
                />
              </EuiFormRow>
            </EuiPanel>
            <EuiSpacer />
            <EuiPanel>
              <EuiTitle size='s'>
                <h2>
                  {i18n.translate('wazuh.security.editUser.passwordTitle', {
                    defaultMessage: 'Password',
                  })}
                </h2>
              </EuiTitle>
              <EuiFormRow
                label=''
                isInvalid={!!formErrors.password}
                error={formErrors.password}
                helpText={i18n.translate(
                  'wazuh.security.editUser.passwordHelpText',
                  { defaultMessage: 'Introduce a new password for the user.' },
                )}
              >
                <EuiFieldPassword
                  placeholder={i18n.translate(
                    'wazuh.security.editUser.passwordPlaceholder',
                    { defaultMessage: 'Password' },
                  )}
                  value={password}
                  onChange={e => onChangePassword(e)}
                  aria-label=''
                  isInvalid={!!formErrors.password}
                  disabled={WzAPIUtils.isReservedID(currentUser.id)}
                />
              </EuiFormRow>
              <EuiFormRow
                label=''
                isInvalid={!!formErrors.confirmPassword}
                error={formErrors.confirmPassword}
                helpText={i18n.translate(
                  'wazuh.security.editUser.confirmPasswordHelpText',
                  { defaultMessage: 'Confirm the new password.' },
                )}
              >
                <EuiFieldPassword
                  placeholder={i18n.translate(
                    'wazuh.security.editUser.confirmPasswordPlaceholder',
                    { defaultMessage: 'Confirm Password' },
                  )}
                  value={confirmPassword}
                  onChange={e => onChangeConfirmPassword(e)}
                  aria-label=''
                  isInvalid={!!formErrors.confirmPassword}
                  disabled={WzAPIUtils.isReservedID(currentUser.id)}
                />
              </EuiFormRow>
            </EuiPanel>
            <EuiSpacer />
            <EuiPanel>
              <EuiTitle size='s'>
                <h2>
                  {i18n.translate('wazuh.security.editUser.rolesTitle', {
                    defaultMessage: 'Roles',
                  })}
                </h2>
              </EuiTitle>
              <EuiFormRow
                label=''
                helpText={i18n.translate(
                  'wazuh.security.editUser.rolesHelpText',
                  { defaultMessage: 'Assign roles to the selected user' },
                )}
              >
                <EuiComboBox
                  placeholder={i18n.translate(
                    'wazuh.security.editUser.rolesPlaceholder',
                    { defaultMessage: 'Select roles' },
                  )}
                  options={rolesOptions}
                  selectedOptions={selectedRoles}
                  isLoading={rolesLoading || isLoading}
                  onChange={onChangeRoles}
                  isClearable={true}
                  data-test-subj='demoComboBox'
                  isDisabled={WzAPIUtils.isReservedID(currentUser.id)}
                />
              </EuiFormRow>
            </EuiPanel>

            <EuiSpacer />
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <WzButtonPermissions
                  type='default'
                  permissions={[
                    {
                      action: 'security:update',
                      resource: `user:id:${currentUser.id}`,
                    },
                    ...(allowRunAs !== currentUser.allow_run_as
                      ? [
                          {
                            action: 'security:edit_run_as',
                            resource: '*:*:*',
                          },
                        ]
                      : []),
                  ]}
                  fill
                  isLoading={isLoading}
                  isDisabled={
                    WzAPIUtils.isReservedID(currentUser.id) || !showApply
                  }
                  onClick={editUser}
                >
                  {i18n.translate('wazuh.security.editUser.applyButton', {
                    defaultMessage: 'Apply',
                  })}
                </WzButtonPermissions>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiForm>
        </EuiFlyoutBody>
      </WzFlyout>
      {modal}
    </>
  );
};
