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

import React, { } from 'react';
import {
  EuiFlexItem,
  EuiImage,
  EuiPanel,
  EuiText,
  EuiFlexGroup,
  EuiForm,
  EuiDescribedFormGroup,
  EuiTitle,
  EuiSpacer
} from '@elastic/eui';
import { EuiIconTip } from '@elastic/eui';
import { EpluginSettingType, TPluginSettingWithKey, UI_LOGGER_LEVELS } from '../../../../../../../../common/constants';
import { getPluginSettingDescription } from '../../../../../../../../common/services/settings';
import classNames from 'classnames';
import { InputForm } from '../../../../../../common/form';
import { getErrorOrchestrator } from '../../../../../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../../../../../react-services/error-orchestrator/types';
import { updateAppConfig } from '../../../../../../../redux/actions/appConfigActions';
import { WzRequest } from '../../../../../../../react-services';
import { WzButtonModalConfirm } from '../../../../../../common/buttons';
import { useDispatch } from 'react-redux';
import { getHttp } from '../../../../../../../kibana-services';
import { getAssetURL } from '../../../../../../../utils/assets';


interface ICategoryProps {
  title: string
  items: TPluginSettingWithKey[]
  currentConfiguration: { [field: string]: any }
  changedConfiguration: { [field: string]: any }
  onChangeFieldForm: () => void
}

export const Category: React.FunctionComponent<ICategoryProps> = ({ title, items, currentConfiguration, changedConfiguration, onChangeFieldForm }) => {
  return (
    <EuiFlexItem>
      <EuiPanel paddingSize="l">
        <EuiText>
          <EuiFlexGroup>
            <EuiFlexItem>
              <h2>{title}</h2>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiText>
        <EuiForm>
        {items.map((item, idx) => {
            const isUpdated = changedConfiguration?.[item.key] && !changedConfiguration?.[item.key]?.error;
            const error = changedConfiguration?.[item.key]?.error;
            
            return (
              <EuiDescribedFormGroup
                fullWidth
                key={idx}
                className={classNames('mgtAdvancedSettings__field', {
                  'mgtAdvancedSettings__field--unsaved': isUpdated,
                  'mgtAdvancedSettings__field--invalid': error
                })}
                title={
                  <EuiTitle className="mgtAdvancedSettings__fieldTitle" size="s">
                    <span>
                      {item.title}
                      {error && (
                        <EuiIconTip
                        anchorClassName="mgtAdvancedSettings__fieldTitleUnsavedIcon"
                        type='alert'
                        color='danger'
                        aria-label={item.key}
                        content='Invalid' />
                      )}
                      {isUpdated && (
                        <EuiIconTip
                        anchorClassName="mgtAdvancedSettings__fieldTitleUnsavedIcon"
                        type='dot'
                        color='warning'
                        aria-label={item.key}
                        content='Unsaved' />
                      )}
                    </span>
                  </EuiTitle>}
                description={getPluginSettingDescription(item)} >
                  <InputForm
                    field={{
                      ...item,
                      ...(item.transformUIInputValue ? {transformInputValue: item.transformUIInputValue.bind(item)} : {}),
                      ...(item.validate ? {validate: item.validate.bind(item)} : {})
                    }}
                    label={item.key}
                    initialValue={item.type === EpluginSettingType.editor ? JSON.stringify(currentConfiguration[item.key]) : currentConfiguration[item.key]}
                    onChange={onChangeFieldForm}
                    {...((item.type === EpluginSettingType.filepicker && currentConfiguration[item.key])
                      ? {
                          preInput: () => (
                            <InputFormFilePickerPreInput
                              image={getHttp().basePath.prepend(getAssetURL(currentConfiguration[item.key]))}
                              field={item}
                            />
                          )
                        }
                      : {}
                    )}
                  />
              </EuiDescribedFormGroup>
            )
          })}
        </EuiForm>
      </EuiPanel>
    </EuiFlexItem>
  )
};

const InputFormFilePickerPreInput = ({image, field}: {image: string, field: any}) => {
  const dispatch = useDispatch();

  return (
    <>
      <EuiFlexGroup alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiImage src={image} size='s'/>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <WzButtonModalConfirm
            buttonType="icon"
            tooltip={{
              content: 'Delete file',
              position: 'top',
            }}
            modalTitle={`Do you want to delete the ${field.key} file?`}
            onConfirm={async () => {
              try{
                const response = await WzRequest.genericReq('DELETE', `/utils/configuration/files/${field.key}`);
                dispatch(updateAppConfig(response.data.updatedConfiguration));
              }catch(error){
                const options = {
                  context: `${InputFormFilePickerPreInput.name}.confirmDeleteFile`,
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
      <EuiSpacer size='s' />
    </>
  );
};
