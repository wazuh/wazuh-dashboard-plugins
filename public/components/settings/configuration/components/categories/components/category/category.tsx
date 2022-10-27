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
  EuiSpacer,
  EuiToolTip,
  EuiButtonIcon,
} from '@elastic/eui';
import { EuiIconTip } from '@elastic/eui';
import { TPluginSettingWithKey } from '../../../../../../../../common/constants';
import { getPluginSettingDescription } from '../../../../../../../../common/services/settings';
import { webDocumentationLink } from '../../../../../../../../common/services/web_documentation';
import classNames from 'classnames';
import { InputForm } from '../../../../../../common/form';


interface ICategoryProps {
  title: string
  description?: string
  documentationLink?: string
  items: TPluginSettingWithKey[]
  currentConfiguration: { [field: string]: any }
  changedConfiguration: { [field: string]: any }
  onChangeFieldForm: () => void
}

export const Category: React.FunctionComponent<ICategoryProps> = ({
  title,
  description,
  documentationLink,
  items
}) => {
  return (
    <EuiFlexItem>
      <EuiPanel paddingSize="l">
        <EuiText>
          <EuiFlexGroup>
            <EuiFlexItem>
              <h2>{title}{
                documentationLink &&
                <EuiToolTip
                  position="right"
                  content="Documentation">
                  <>
                    &nbsp;
                  <EuiButtonIcon
                      iconType="iInCircle"
                      iconSize="l"
                      aria-label="Help"
                      target="_blank"
                      href={webDocumentationLink(documentationLink)}
                    ></EuiButtonIcon>
                  </>
                </EuiToolTip>
              }
              </h2>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiText>
        {
          description &&
          <>
            <EuiText color="subdued">
              <EuiFlexGroup>
                <EuiFlexItem>
                  <span>{description}</span>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiText>
            <EuiSpacer />
          </>
        }
        <EuiForm>
        {items.map((item, idx) => {
            const isUpdated = item.changed && !item.error;
            return (
              <EuiDescribedFormGroup
                fullWidth
                key={idx}
                className={classNames('mgtAdvancedSettings__field', {
                  'mgtAdvancedSettings__field--unsaved': isUpdated,
                  'mgtAdvancedSettings__field--invalid': item.error
                })}
                title={
                  <EuiTitle className="mgtAdvancedSettings__fieldTitle" size="s">
                    <span>
                      {item.title}
                      {item.error && (
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
                    label={item.key}
                    {...item}
                  />
              </EuiDescribedFormGroup>
            )
          })}
        </EuiForm>
      </EuiPanel>
    </EuiFlexItem>
  )
};
