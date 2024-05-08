/*
 * Wazuh app - React components MainPanel
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPageBody } from '@elastic/eui';
import { ModuleSidePanel } from './components/';
import WzReduxProvider from '../../../../redux/wz-redux-provider';
import { AppState } from '../../../../react-services/app-state';
import { useFilterManager } from '../../hooks';
import { Filter } from '../../../../../../../src/plugins/data/public/';
import {
  FilterMeta,
  FilterState,
  FilterStateStore,
} from '../../../../../../../src/plugins/data/common';
import { SampleDataWarning } from '../../../visualize/components';

type MainPanelProps = {
  sidePanelChildren?: React.ReactNode;
  moduleConfig?: any;
  filterDrillDownValue?: (value: any) => void;
  onChangeView?: (selectedFilter) => void;
};

export const MainPanel = ({
  sidePanelChildren,
  moduleConfig = {},
  filterDrillDownValue,
  onChangeView
}: MainPanelProps) => {
  const [viewId, setViewId] = useState('main');
  const [selectedFilter, setSelectedFilter] = useState({
    field: '',
    value: '',
  });

  const toggleView = (id = 'main') => {
    if (id != viewId) setViewId(id);
  };

  const toggleFilter = (field = '', value = '') => {
    console.log('toggle filter');
    setSelectedFilter({ field, value });
    onChangeView({ field, value });
  };

  /**
   * Builds active view
   * @param props
   * @returns React.Component
   */
  const ModuleContent = useCallback(
    rest => {
      const View = moduleConfig[viewId].component;
      return (
        <WzReduxProvider>
          <View
            {...rest}
            selectedFilter={selectedFilter}
            toggleFilter={toggleFilter}
            changeView={toggleView}
          />
        </WzReduxProvider>
      );
    },
    [viewId],
  );

  return (
    <EuiFlexGroup style={{ margin: '0 8px' }}>
      <EuiFlexItem>
        {sidePanelChildren && (
          <ModuleSidePanel>{sidePanelChildren}</ModuleSidePanel>
        )}
        <EuiPageBody>
          <SampleDataWarning />
          <ModuleContent />
        </EuiPageBody>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
