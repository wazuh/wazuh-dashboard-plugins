/*
 * Wazuh app - React View OfficeDrilldown.
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
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiTitle } from '@elastic/eui';
import { VisConfigLayout } from '../../../common/modules/panel/components';

export const OfficeDrilldown = ({
  title = '',
  changeView,
  toggleFilter,
  rows = [],
  selectedFilter = { field: '', value: '' },
}) => {
  const rowClickHandler = () => {
    toggleFilter(selectedFilter.field);
    changeView('main');
  };

  return (
    <>
      <EuiFlexGroup className={'wz-margin-0'}>
        <EuiFlexItem grow={false}>
          <div>
            <EuiButtonEmpty onClick={() => rowClickHandler()} iconType={'sortLeft'} />
          </div>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiTitle size="s">
            <h3>{title}</h3>
          </EuiTitle>
          <p>{selectedFilter.value}</p>
        </EuiFlexItem>
      </EuiFlexGroup>
      <VisConfigLayout rows={rows} rowClickHandler={rowClickHandler} />
    </>
  );
};
