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
import { FieldForm } from './components';
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
import { TPluginSettingWithKey } from '../../../../../../../../common/constants';
import { getPluginSettingDescription } from '../../../../../../../../common/services/settings';
import classNames from 'classnames';

interface ICategoryProps {
  name: string
  items: TPluginSettingWithKey[]
  currentConfiguration: { [field: string]: any }
  changedConfiguration: { [field: string]: any }
  onChangeFieldForm: () => void
}

export const Category: React.FunctionComponent<ICategoryProps> = ({ name, items, currentConfiguration, changedConfiguration, onChangeFieldForm }) => {
  return (
    <EuiFlexItem>
      <EuiPanel paddingSize="l">
        <EuiText>
          <EuiFlexGroup>
            <EuiFlexItem>
              <h2>{name}</h2>
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
                      {item.name}
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
                  <FieldForm
                    item={item}
                    value={currentConfiguration[item.key]}
                    initialValue={currentConfiguration[item.key]}
                    onChange={onChangeField(onChangeFieldForm, item.key)}
                  />
              </EuiDescribedFormGroup>
            )
          })}
        </EuiForm>
      </EuiPanel>
    </EuiFlexItem>
  )
};

const getValue = ({ item, value, currentConfiguration }) => typeof currentConfiguration[item.key] !== 'undefined'
  ? currentConfiguration[item.key]
  : value;

// TODO: this could be removed if the function works with the returned value
const onChangeField = (fn, field) => {
  return ({...rest}) => {
    fn({...rest, field})
  };
}