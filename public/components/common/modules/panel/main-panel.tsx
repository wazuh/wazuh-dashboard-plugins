import React, { useEffect, useState, useCallback } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageBody,
} from '@elastic/eui';
import { ModuleSidePanel } from './components/';
import WzReduxProvider from '../../../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../../../react-services/vis-factory-handler';
import { AppState } from '../../../../react-services/app-state';
import { useFilterManager } from '../../hooks';
import { FilterHandler } from '../../../../utils/filter-handler';
import { TabVisualizations } from '../../../../factories/tab-visualizations';
import { Filter } from '../../../../../../../src/plugins/data/public/';
import { FilterMeta, FilterState, FilterStateStore } from '../../../../../../../src/plugins/data/common';
import { SampleDataWarning } from '../../../visualize/components';


export const MainPanel = ({ sidePanelChildren, tab = 'general', moduleConfig = {}, ...props }) => {

  const [viewId, setViewId] = useState('main');
  const [selectedFilter, setSelectedFilter] = useState({ field: '', value: '' });
  const filterManager = useFilterManager();

  useEffect(() => {
    (async () => {
      const tabVisualizations = new TabVisualizations();
      tabVisualizations.removeAll();
      tabVisualizations.setTab(tab);
      tabVisualizations.assign({
        [tab]: moduleConfig[viewId].length(),
      });
      const filterHandler = new FilterHandler(AppState.getCurrentPattern());
      await VisFactoryHandler.buildOverviewVisualizations(filterHandler, tab, null, true);
    })()
  }, [viewId])

  /**
   * When a filter is toggled applies de selection
   */
  const applyFilter = (clearOnly = false) => {
    const appliedFilters = filterManager.getAppFilters();
    const filters = appliedFilters.filter((filter) => {
      return filter.meta.key != selectedFilter.field;
    });
    if (!clearOnly && selectedFilter.value) {
      const customFilter = buildCustomFilter(selectedFilter);
      filters.push(customFilter);
    }
    filterManager.setFilters(filters);
  }

  useEffect(() => {
    applyFilter();

    return () => applyFilter(true);
  }, [selectedFilter])


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
      params: { query: value },
      alias: null,
      type: "phrase",
      index: AppState.getCurrentPattern(),
    };
    const $state: FilterState = {
      store: FilterStateStore.APP_STATE,
      isImplicit: true
    };
    const query = {
      match: {
        [field]: {
          query: value,
          type: 'phrase'
        }
      }
    }

    return { meta, $state, query };
  }

  const toggleView = (id = 'main') => {
    if (id != viewId)
      setViewId(id);
  }

  const toggleFilter = (field = '', value = '') => {
    setSelectedFilter({ field, value });
  }

  /**
   * Builds active view
   * @param props 
   * @returns React.Component
   */
  const ModuleContent = useCallback(() => {
    const View = moduleConfig[viewId].component;
    return <WzReduxProvider><View selectedFilter={selectedFilter} toggleFilter={toggleFilter} changeView={toggleView} /></WzReduxProvider>
  }, [viewId])

  return (
    <EuiFlexGroup style={{ margin: '0 8px' }}>
      <EuiFlexItem>
        {sidePanelChildren && <ModuleSidePanel>
          {sidePanelChildren}
        </ModuleSidePanel >
        }
        <EuiPageBody>
          <SampleDataWarning />
          <ModuleContent />
        </EuiPageBody>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

