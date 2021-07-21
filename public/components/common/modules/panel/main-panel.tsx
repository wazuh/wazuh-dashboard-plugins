import React, { useEffect, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageBody,
} from '@elastic/eui';
import { ModuleSidePanel } from './';
import { FilterManager, Filter } from '../../../../../../../src/plugins/data/public/';
import { getDataPlugin } from '../../../../kibana-services';
import { KbnSearchBar } from '../../../kbn-search-bar';
import { TimeRange, Query } from '../../../../../../../src/plugins/data/common';
import WzReduxProvider from '../../../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../../../react-services/vis-factory-handler';
import { AppState } from '../../../../react-services/app-state';
import { FilterHandler } from '../../../../utils/filter-handler';
import { TabVisualizations } from '../../../../factories/tab-visualizations';


export const MainPanel = ({ sidePanelChildren, tab='general', moduleConfig = {}, ...props }) => {

  const [viewId, setViewId] = useState('main');

  const KibanaServices = getDataPlugin().query;
  const filterManager = KibanaServices.filterManager;
  const timefilter = KibanaServices.timefilter.timefilter;

  const [isLoading, setLoading] = useState(false);
  const [filterParams, setFilterParams] = useState({
    filters: filterManager.getFilters() || [],
    query: { language: 'kuery', query: '' },
    time: timefilter.getTime(),
  });


  useEffect(() => {
    (async () => {
      const tabVisualizations = new TabVisualizations();
      tabVisualizations.removeAll();
      tabVisualizations.setTab(tab);
      tabVisualizations.assign({
        [tab]: moduleConfig[viewId].length(),
      });
      const filterHandler = new FilterHandler(AppState.getCurrentPattern());
      await VisFactoryHandler.buildOverviewVisualizations(filterHandler, tab, null);
    })()
  }, [viewId])

  const onQuerySubmit = (payload: { dateRange: TimeRange, query: Query }) => {
    const { query, dateRange } = payload;
    const filters = { query, time: dateRange, filters: filterParams.filters };
    setLoading(true);
    setFilterParams(filters);

  }

  const onFiltersUpdated = (filters: Filter[]) => {
    const { query, time } = filterParams;
    const updatedFilterParams = { query, time, filters };
    setLoading(true);
    setFilterParams(updatedFilterParams);
  }

  const toggleView = (id = 'main') => {
    setViewId(id);
  }

  /**
   * Builds active view
   * @param props 
   * @returns React.Component
   */
  const ModuleContent = () => {

    const View = moduleConfig[viewId].component;
    return <WzReduxProvider><View changeView={toggleView} /></WzReduxProvider>
  }

  return (
    <EuiFlexGroup style={{ margin: '0 8px' }}>
      <EuiFlexItem>
        {sidePanelChildren && <ModuleSidePanel>
          {sidePanelChildren}
        </ModuleSidePanel >
        }
        <EuiPageBody>
          <KbnSearchBar
            onQuerySubmit={onQuerySubmit}
            onFiltersUpdated={onFiltersUpdated}
            isLoading={isLoading} />
          <ModuleContent />
        </EuiPageBody>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

