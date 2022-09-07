/*
 * Wazuh app - React component building the configuration component.
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
  EuiCodeEditor,
  EuiImage,
  EuiFilePicker,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTextArea,
} from '@elastic/eui';
import 'brace/mode/javascript';
import 'brace/snippets/javascript';
import 'brace/ext/language_tools';
import "brace/ext/searchbox";
import {
  UI_ERROR_SEVERITIES,
} from '../../../../../../../../react-services/error-orchestrator/types';
import { TPluginSettingWithKey, UI_LOGGER_LEVELS } from '../../../../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../../../../react-services/common-services';
import _ from 'lodash';
import { WzButtonModalConfirm } from '../../../../../../../common/buttons';
import { WzRequest } from '../../../../../../../../react-services';
import { getAssetURL } from '../../../../../../../../utils/assets';
import { getHttp } from '../../../../../../../../kibana-services';
import { useDispatch } from 'react-redux';
import { updateAppConfig } from '../../../../../../../../redux/actions/appConfigActions';
import { useFormFieldChanged } from '../../../../../../../common/hooks';

interface IFieldForm {
  item: TPluginSettingWithKey
  value: any
  initialValue: any
  onChange: () => void
}

export const FieldForm: React.FunctionComponent<IFieldForm> = (props) => {
  const { item } = props;
  const ComponentForm = Form[item.type];

  if(ComponentForm){
    return <ComponentForm {...props}/>
  };

  return null;
};

//#region forms
const TextForm: React.FunctionComponent<IFieldForm> = ({item, initialValue, onChange: onChangeFormField}) => {
  const { value, error, onChange } = useFormFieldChanged(
    item.key,
    initialValue,
    {validate: item?.validate, onChange: onChangeFormField, type: item.type}
  );

  const isInvalid = Boolean(error);

  return (
    <EuiFormRow label={item.key} fullWidth isInvalid={isInvalid} error={error}>
      <EuiFieldText
        fullWidth
        value={value}
        isInvalid={isInvalid}
        onChange={onChange} />
    </EuiFormRow>
  );
};

const TextAreaForm: React.FunctionComponent<IFieldForm> = ({item, initialValue, onChange: onChangeFormField}) => {
  const { value, error, onChange } = useFormFieldChanged(
    item.key,
    initialValue,
    {validate: item?.validate, onChange: onChangeFormField, type: item.type}
  );

  const isInvalid = Boolean(error);

  return (
    <EuiFormRow label={item.key} fullWidth isInvalid={isInvalid} error={error}>
      <EuiTextArea
        fullWidth
        value={value}
        isInvalid={isInvalid}
        onChange={onChange} />
    </EuiFormRow>
  );
};

const NumberForm: React.FunctionComponent<IFieldForm> = ({item, initialValue, onChange: onChangeFormField}) => {
  const { value, error, onChange } = useFormFieldChanged(
    item.key,
    initialValue,
    {validate: item?.validate, onChange: onChangeFormField, type: item.type}
  );

  const isInvalid = Boolean(error);

  return (
    <EuiFormRow label={item.key} fullWidth isInvalid={isInvalid} error={error}>
      <EuiFieldNumber
        fullWidth
        value={value}
        onChange={onChange} />
    </EuiFormRow>
  );
};

  
const BooleanForm: React.FunctionComponent<IFieldForm> = ({item, initialValue, onChange: onChangeFormField}) => {
  const { value, error, onChange } = useFormFieldChanged(
    item.key,
    initialValue,
    {validate: item?.validate, onChange: onChangeFormField, type: item.type}
  );

  const isInvalid = Boolean(error);

  return (
    <EuiFormRow label={item.key} fullWidth isInvalid={isInvalid} error={error}>
      <EuiSwitch
        label={String(value)}
        checked={value}
        onChange={onChange} />
    </EuiFormRow>
  );
};

const ListForm: React.FunctionComponent<IFieldForm> = ({item, initialValue, onChange: onChangeFormField}) => {
  const { value, error, onChange } = useFormFieldChanged(
    item.key,
    initialValue,
    {validate: item?.validate, onChange: onChangeFormField, type: item.type}
  );

  const isInvalid = Boolean(error);

  return (
    <EuiFormRow label={item.key} fullWidth isInvalid={isInvalid} error={error}>
      <EuiSelect
        options={item.options.choices}
        value={value}
        onChange={onChange} />
    </EuiFormRow>
  )
};

const IntervalForm: React.FunctionComponent<IFieldForm> = ({item, initialValue, onChange: onChangeFormField}) => {
  const { value, error, onChange } = useFormFieldChanged(
    item.key,
    initialValue,
    {validate: item?.validate, onChange: onChangeFormField, type: item.type}
  );

  const isInvalid = Boolean(error);

  return (
    <EuiFormRow label={item.key} fullWidth isInvalid={isInvalid} error={error}>
      <EuiFieldText
        fullWidth
        value={value}
        isInvalid={isInvalid}
        onChange={onChange}
      />
    </EuiFormRow>
  );
}

const ArrayForm: React.FunctionComponent<IFieldForm> = ({item, initialValue, onChange: onChangeFormField}) => {
  const { value, error, onChange } = useFormFieldChanged(
    item.key,
    JSON.stringify(initialValue),
    {validate: item?.validate, onChange: onChangeFormField, type: item.type}
  );

  const isInvalid = Boolean(error);

  return (
    <EuiFormRow label={item.key} fullWidth isInvalid={isInvalid} error={error}>
      <EuiCodeEditor
        mode='json'
        height='50px'
        width='100%'
        value={value}
        onChange={onChange}
    />
    </EuiFormRow>
  );
}

const FilePickerForm: React.FunctionComponent<IFieldForm> = ({item, initialValue, onChange: onChangeFormField, value: valueImage}) => {
  const dispatch = useDispatch();
  const filename = valueImage ? getHttp().basePath.prepend(getAssetURL(valueImage)) : null;

  const { error, onChange } = useFormFieldChanged(
    item.key,
    JSON.stringify(initialValue),
    {validate: item?.validate, onChange: onChangeFormField, type: item.type}
  );

  const isInvalid = Boolean(error);

  return (
    <EuiFormRow label={item.key} fullWidth isInvalid={isInvalid} error={error}>
      <>
        {filename && (
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiImage src={filename} size='s'/>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <WzButtonModalConfirm
                buttonType="icon"
                tooltip={{
                  content: 'Delete file',
                  position: 'top',
                }}
                modalTitle={`Do you want to delete the ${item.key} file?`}
                onConfirm={async () => {
                  try{
                    await WzRequest.genericReq('DELETE', `/utils/configuration/files/${item.key}`);
                    dispatch(updateAppConfig({[item.key]: ''}));
                  }catch(error){
                    const options = {
                      context: `${FilePickerForm.name}.confirmDeletePolicy`,
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
                  }
                }}
                modalProps={{ buttonColor: 'danger' }}
                iconType="trash"
                color="danger"
                aria-label="Delete file"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
        <EuiSpacer size='s' />
        <EuiFilePicker
          id={''}
          initialPromptText="Select or drag the file"
          onChange={(fileList) => onChange(fileList?.[0])}
          display={true ? 'large' : 'default'}
          fullWidth
          aria-label="Upload a file"
        />
      </>
    </EuiFormRow>
  );
}

const Form = {
  text: TextForm,
  number: NumberForm,
  boolean: BooleanForm,
  list: ListForm,
  array: ArrayForm,
  interval: IntervalForm,
  filepicker: FilePickerForm,
  textarea: TextAreaForm
}

//#endregion
