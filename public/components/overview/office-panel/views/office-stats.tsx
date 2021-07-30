/*
 * Wazuh app - React View OfficeStats.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { EuiDescriptionList, EuiFlexItem, EuiFlexGroup, EuiTitle, EuiCallOut } from '@elastic/eui';
import moduleLogo from '../../../../assets/office365.svg';
import React from 'react';
import './office-stats.scss';

export const OfficeStats = ({ listItems = [] }) => {
  const logoStyle = { width: 30 };
  return (
    <EuiFlexGroup direction={'column'} alignItems={'flexStart'}>
      <EuiFlexItem>
        <EuiFlexGroup>
          <EuiFlexItem className={'wz-justify-center'}>
            <img alt="moduleLogo" src={moduleLogo} style={logoStyle} />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size={'s'}>
              <h4 className={'office-stats-title'}>Office 365</h4>
            </EuiTitle>
            <EuiTitle size={'xs'}>
              <h5 className={'office-stats-subtitle'}>Module configuration</h5>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem>
        {
          listItems.length ? (
            <EuiDescriptionList className={'office-description-list'} listItems={listItems} compressed />) : (
            <EuiCallOut className={'office-stats-callout-warning'}
              title="Module configuration unavailable"
              color="warning"
              iconType="warning" />)
        }
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
