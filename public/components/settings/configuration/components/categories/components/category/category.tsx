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
  EuiPanel,
  EuiText,
  EuiFlexGroup,
  EuiForm,
  EuiDescribedFormGroup,
  EuiTitle,
  EuiFormRow
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
            return (
              <EuiDescribedFormGroup
                fullWidth
                key={idx}
                className={classNames('mgtAdvancedSettings__field', {
                  'mgtAdvancedSettings__field--unsaved': isUpdated,
                })}
                title={
                  <EuiTitle className="mgtAdvancedSettings__fieldTitle" size="s">
                    <span>
                      {item.title}
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
                description={item.description} >
                  <InputForm
                    field={{
                      ...item,
                      ...(item.transformUIInputValue ? {transformInputValue: item.transformUIInputValue.bind(item)} : {})
                    }}
                    label={item.key}
                    initialValue={item.type === EpluginSettingType.editor ? JSON.stringify(currentConfiguration[item.key]) : currentConfiguration[item.key]}
                    onChange={onChangeFieldForm}
                  />
              </EuiDescribedFormGroup>
            )
          })}
        </EuiForm>
      </EuiPanel>
    </EuiFlexItem>
  )
};
