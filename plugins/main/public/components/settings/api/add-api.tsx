/*
 * Wazuh app - React component for the adding an API entry form.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiButton,
} from '@elastic/eui';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { getWazuhCorePlugin } from '../../../kibana-services';
import { useForm } from '../../common/form/hooks';
import { InputForm } from '../../common/form';
import { ErrorHandler, GenericRequest } from '../../../react-services';

const transformPluginSettingsToFormFields = (configuration, pluginSettings) => {
  return Object.entries(pluginSettings).reduce(
    (
      accum,
      [
        key,
        {
          type,
          validate,
          defaultValue: initialValue,
          uiFormTransformChangedInputValue,
          uiFormTransformConfigurationValueToInputValue,
          uiFormTransformInputValueToConfigurationValue,
          ...rest
        },
      ],
    ) => {
      return {
        ...accum,
        [key]: {
          _meta: rest,
          type,
          validate: validate?.bind?.(rest),
          transformChangedInputValue:
            uiFormTransformChangedInputValue?.bind?.(rest),
          transformChangedOutputValue:
            uiFormTransformInputValueToConfigurationValue?.bind?.(rest),
          initialValue: uiFormTransformConfigurationValueToInputValue
            ? uiFormTransformConfigurationValueToInputValue.bind(rest)(
                configuration?.[key] ?? initialValue,
              )
            : configuration?.[key] ?? initialValue,
          defaultValue: uiFormTransformConfigurationValueToInputValue
            ? uiFormTransformConfigurationValueToInputValue.bind(rest)(
                configuration?.[key] ?? initialValue,
              )
            : configuration?.[key] ?? initialValue,
          options: rest.options,
        },
      };
    },
    {},
  );
};

interface IPropsAddAPIHostForm {
  initialValue?: {
    id?: string;
    url?: string;
    port?: number;
    username?: string;
    password?: string;
    run_as?: string;
  };
  apiId: string;
}

export const AddAPIHostForm = ({
  initialValue = {},
  apiId = '',
}: IPropsAddAPIHostForm) => {
  const { fields, changed, errors } = useForm(
    transformPluginSettingsToFormFields(initialValue, {
      ...Array.from(
        getWazuhCorePlugin().configuration._settings.entries(),
      ).find(([key]) => key === 'hosts')[1].options.arrayOf,
      // Add an input to confirm the password
      password_confirm: {
        ...Array.from(
          getWazuhCorePlugin().configuration._settings.entries(),
        ).find(([key]) => key === 'hosts')[1].options.arrayOf.password,
        title: 'Confirm password',
      },
    }),
  );

  const mode = apiId ? 'EDIT' : 'CREATE';

  const onSave = async () => {
    try {
      const apiHostId = apiId || fields.id.value;
      let saveFields = fields;
      if (mode === 'EDIT') {
        saveFields = Object.fromEntries(
          Object.keys(changed).map(key => [key, fields[key]]),
        );
      }
      const { password_confirm, ...rest } = saveFields;

      const response = await GenericRequest.request(
        'PUT',
        `/hosts/apis/${apiHostId}`,
        Object.entries(rest).reduce(
          (accum, [key, { value, transformChangedOutputValue }]) => ({
            ...accum,
            [key]: transformChangedOutputValue?.(value) ?? value,
          }),
          {},
        ),
      );
      ErrorHandler.info(response.data.message);
    } catch (error) {
      const options = {
        context: 'AddAPIHostForm.onSave',
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        store: false,
        error: {
          error: error,
          message: error.message || error,
          title: `API host could not be updated due to ${error.message}`,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  };

  const passwordNotMatch =
    fields.password.value !== fields.password_confirm.value;

  return (
    <div>
      {[
        'id',
        'url',
        'port',
        'username',
        'password',
        'password_confirm',
        'run_as',
      ].map(key => {
        const { _meta, ...field } = fields[key];
        return (
          <InputForm
            label={_meta.title}
            description={_meta.description}
            {...field}
          />
        );
      })}
      <EuiSpacer />
      {passwordNotMatch && (
        <EuiText color='danger' size='s'>
          Password must match.
        </EuiText>
      )}
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiButton
            disabled={Boolean(Object.keys(errors).length) || passwordNotMatch}
            fill
            onClick={onSave}
          >
            Apply
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
