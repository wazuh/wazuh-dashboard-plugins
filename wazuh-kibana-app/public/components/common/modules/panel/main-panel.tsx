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
import { VisFactoryHandler } from '../../../../react-services/vis-factory-handler';
import { AppState } from '../../../../react-services/app-state';
import { useFilterManager } from '../../hooks';
import { FilterHandler } from '../../../../utils/filter-handler';
import { TabVisualizations } from '../../../../factories/tab-visualizations';
import { Filter } from '../../../../../../../src/plugins/data/public/';
import {
  FilterMeta,
  FilterState,
  FilterStateStore,
} from '../../../../../../../src/plugins/data/common';
import { SampleDataWarning } from '../../../visualize/components';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

export const MainPanel = ({ sidePanelChildren, tab = 'general', moduleConfig = {}, filterDrillDownValue = (value) => {}, ...props }) => {
  const [viewId, setViewId] = useState('main');
  const [selectedFilter, setSelectedFilter] = useState({ field: '', value: '' });
  const { filterManager, filters } = useFilterManager();

  const buildOverviewVisualization = async () => {
    const tabVisualizations = new TabVisualizations();
    tabVisualizations.removeAll();
    tabVisualizations.setTab(tab);
    tabVisualizations.assign({
      [tab]: moduleConfig[viewId].length(),
    });
    const filterHandler = new FilterHandler(AppState.getCurrentPattern());
    await VisFactoryHandler.buildOverviewVisualizations(filterHandler, tab, null, true);
  };

  useEffect(() => {
    (async () => {
      try {
        await buildOverviewVisualization();
      } catch (error) {
        const options: UIErrorLog = {
          context: `${MainPanel.name}.buildOverviewVisualization`,
          level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
          severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    })();
  }, [viewId]);

  /**
   * When a filter is toggled applies the selection
   */
  const applyFilter = (clearOnly = false) => {
    const newFilters = [
      ...filters.filter((filter) => filter.meta.key !== selectedFilter.field || filter.$state?.store == "globalState"),
      ...(!clearOnly && selectedFilter.value ? [buildCustomFilter(selectedFilter)] : [])
    ];
    filterManager.setFilters(newFilters);
  };

  useEffect(() => {
    applyFilter();
    filterDrillDownValue(selectedFilter)
    return () => applyFilter(true);
  }, [selectedFilter]);

  /**
   * Builds selected filter structure
   * @param value
   * @param field
   */
  const buildCustomFilter = ({ field, value }): Filter => {
    const meta: FilterMeta = {
      disabled: false,
      negate: false,
      key: field,
      params: [value],
      alias: null,
      type: 'phrases',
      value: value,
      index: AppState.getCurrentPattern(),
    };
    const $state: FilterState = {
      store: FilterStateStore.APP_STATE,
      isImplicit: true,
    };
    const query = {
      bool: {
        minimum_should_match: 1,
        should: [{
          match_phrase: {
            [field]: {
              query: value,
            },
          },
        }
        ]
      },
    };

    return { meta, $state, query };
  };

  const toggleView = (id = 'main') => {
    if (id != viewId) setViewId(id);
  };

  const toggleFilter = (field = '', value = '') => {
    setSelectedFilter({ field, value });
  };

  /**
   * Builds active view
   * @param props
   * @returns React.Component
   */
  const ModuleContent = useCallback(() => {
    const View = moduleConfig[viewId].component;
    return (
      <WzReduxProvider>
        <View selectedFilter={selectedFilter} toggleFilter={toggleFilter} changeView={toggleView} />
      </WzReduxProvider>
    );
  }, [viewId]);

  return (
    <EuiFlexGroup style={{ margin: '0 8px' }}>
      <EuiFlexItem>
        {sidePanelChildren && <ModuleSidePanel>{sidePanelChildren}</ModuleSidePanel>}
        <EuiPageBody>
          <SampleDataWarning />
          <ModuleContent />
        </EuiPageBody>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
