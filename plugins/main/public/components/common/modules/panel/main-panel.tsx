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
import { AppState } from '../../../../react-services/app-state';
import { useFilterManager } from '../../hooks';
import { Filter } from '../../../../../../../src/plugins/data/public/';
import {
  FilterMeta,
  FilterState,
  FilterStateStore,
  IndexPattern,
} from '../../../../../../../src/plugins/data/common';
import { SampleDataWarning } from '../../../visualize/components';
import { tUseSearchBarProps } from '../../search-bar/use-search-bar';

type MainPanelProps = {
  sidePanelChildren?: React.ReactNode;
  moduleConfig?: any;
  filterDrillDownValue?: (value: any) => void;
  onChangeView?: (selectedFilter) => void;
  isLoading: boolean;
  dataSourceProps: {
    fetchData: (params: any) => void;
    fetchFilters: any[];
    searchBarProps: tUseSearchBarProps;
    indexPattern: IndexPattern;
  };
  categoriesSampleData: string[];
};

export const MainPanel = (props: MainPanelProps) => {
  const {
    sidePanelChildren,
    moduleConfig = {},
    filterDrillDownValue,
    onChangeView,
    dataSourceProps,
    isLoading,
    categoriesSampleData,
  } = props;
  const [viewId, setViewId] = useState('main');
  const [selectedFilter, setSelectedFilter] = useState({
    field: '',
    value: '',
  });

  const toggleView = (id = 'main') => {
    if (id != viewId) setViewId(id);
  };

  const toggleFilter = (field = '', value = '') => {
    setSelectedFilter({ field, value });
    onChangeView({ field, value });
  };

  useEffect(() => {
    filterDrillDownValue(selectedFilter);
  }, [selectedFilter]);

  if (isLoading) {
    return null;
  }

  /**
   * Builds active view
   * @param props
   * @returns React.Component
   */
  const ModuleContent = useCallback(
    rest => {
      const View = moduleConfig[viewId].component;
      return (
        <View
          {...rest}
          {...dataSourceProps}
          selectedFilter={selectedFilter}
          toggleFilter={toggleFilter}
          changeView={toggleView}
        />
      );
    },
    [viewId, JSON.stringify(dataSourceProps)],
  );

  return (
    <EuiFlexGroup style={{ margin: '0 8px' }}>
      <EuiFlexItem>
        {sidePanelChildren && (
          <ModuleSidePanel>{sidePanelChildren}</ModuleSidePanel>
        )}
        <EuiPageBody>
          <SampleDataWarning categoriesSampleData={categoriesSampleData} />
          <ModuleContent />
        </EuiPageBody>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
