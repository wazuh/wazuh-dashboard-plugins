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
  EuiBottomBar,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiButtonEmpty,
  EuiButton
} from '@elastic/eui';

interface IBottomBarProps {
  unsavedCount: number
  errorsCount: number
  onCancel: () => void
  onSave: () => void
}

export const BottomBar: React.FunctionComponent<IBottomBarProps> = ({ unsavedCount, errorsCount, onCancel, onSave }) => (
  <EuiBottomBar paddingSize="m">
      <EuiFlexGroup alignItems='center' justifyContent='spaceBetween' gutterSize='s'>
        <SettingLabel count={unsavedCount} errors={errorsCount}/>
        <CancelButton onClick={onCancel} />
        <SaveButton onClick={onSave} isDisabled={Boolean(errorsCount)}/>
      </EuiFlexGroup>
    </EuiBottomBar>
);

const SettingLabel = ({ count, errors }) => (
  <EuiFlexItem className='mgtAdvancedSettingsForm__unsavedCount'>
    <EuiText color='ghost' className='mgtAdvancedSettingsForm__unsavedCountMessage'>
      {`${count} unsaved settings`}
    </EuiText>
    {errors ? (
      <EuiText color='danger' className='mgtAdvancedSettingsForm__unsavedCountMessage'>
        {`${errors} setting with ${errors === 1 ? 'error' : 'errors'}`}
      </EuiText>
    ) : null}
  </EuiFlexItem>
);


const CancelButton = ({ onClick }) => (
  <EuiFlexItem grow={false}>
    <EuiButtonEmpty
      size='s'
      iconSide='left'
      iconType='cross'
      color="ghost"
      className="mgtAdvancedSettingsForm__button"
      onClick={onClick}>
      Cancel changes
    </EuiButtonEmpty>
  </EuiFlexItem>
);

const SaveButton = ({ onClick, isDisabled }) => (
  <EuiFlexItem grow={false}>
    <EuiButton
      fill
      size='s'
      iconSide='left'
      iconType='check'
      isDisabled={isDisabled}
      color='secondary'
      className="mgtAdvancedSettingsForm__button"
      onClick={onClick} >
      Save changes
      </EuiButton>
  </EuiFlexItem>
);
