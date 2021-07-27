import React, { useEffect, useState, useCallback } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageBody,
} from '@elastic/eui';
import { ModuleSidePanel } from './';
import WzReduxProvider from '../../../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../../../react-services/vis-factory-handler';
import { AppState } from '../../../../react-services/app-state';
import { FilterHandler } from '../../../../utils/filter-handler';
import { TabVisualizations } from '../../../../factories/tab-visualizations';


export const MainPanel = ({ sidePanelChildren, tab = 'general', moduleConfig = {}, ...props }) => {

  const [viewId, setViewId] = useState('main');

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


  const toggleView = (id = 'main') => {
    if (id != viewId)
      setViewId(id);
  }

  /**
   * Builds active view
   * @param props 
   * @returns React.Component
   */
  const ModuleContent = useCallback(() => {
    const View = moduleConfig[viewId].component;
    return <WzReduxProvider><View changeView={toggleView}/></WzReduxProvider>
  }, [viewId])

  return (
    <EuiFlexGroup style={{ margin: '0 8px' }}>
      <EuiFlexItem>
        {sidePanelChildren && <ModuleSidePanel>
          {sidePanelChildren}
        </ModuleSidePanel >
        }
        <EuiPageBody>
          <ModuleContent />
        </EuiPageBody>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

