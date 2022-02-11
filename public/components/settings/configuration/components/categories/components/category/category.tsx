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
import { ISetting } from '../../../../configuration';
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

interface ICategoryProps {
  name: string
  items: ISetting[]
  updatedConfig: { [field: string]: string | number | boolean | [] }
  setUpdatedConfig({ }): void
}

export const Category: React.FunctionComponent<ICategoryProps> = ({ name, items, updatedConfig, setUpdatedConfig }) => {
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
          {items.map((item, idx) => (
            <EuiDescribedFormGroup
              fullWidth
              key={idx}
              className={`mgtAdvancedSettings__field${isUpdated(updatedConfig, item) ? ' mgtAdvancedSettings__field--unsaved' : ''}`}
              title={
                <EuiTitle className="mgtAdvancedSettings__fieldTitle" size="s">
                  <span>
                    {item.name}
                    {isUpdated(updatedConfig, item)
                      && <EuiIconTip
                        anchorClassName="mgtAdvancedSettings__fieldTitleUnsavedIcon"
                        type={'dot'}
                        color={'warning'}
                        aria-label={item.setting}
                        content={`${updatedConfig[item.setting]}`} />}
                  </span></EuiTitle>}
              description={item.description} >
              <EuiFormRow label={item.setting} fullWidth>
                <FieldForm item={item} updatedConfig={updatedConfig} setUpdatedConfig={setUpdatedConfig} />
              </EuiFormRow>
            </EuiDescribedFormGroup>
          ))}
        </EuiForm>
      </EuiPanel>
    </EuiFlexItem>
  )
}

const isUpdated = (configs, item) => typeof configs[item.setting] !== 'undefined'