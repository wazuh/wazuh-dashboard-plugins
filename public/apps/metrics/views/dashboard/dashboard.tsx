import React, { useState, useEffect } from 'react';
import {
  EuiText,
  EuiSpacer,
  EuiListGroup,
} from '@elastic/eui';
import { CoreStart } from '../../../../../../../src/core/public';
// import { DashboardEmbeddableByValue } from '../../../../../../../examples/dashboard_embeddable_examples/public/by_value/embeddable';
import {
  getAngularModule,
  getToasts,
  getVisualizationsPlugin,
  getSavedObjects,
  getDataPlugin,
  getChrome,
  getOverlays,
  getPlugins,
  getNavigationPlugin
} from '../../../../kibana-services';
import { WzKpi } from '../../components/wz-kpi/wz-kpi';
import {useDashboardConfiguration} from './configuration';


interface DashboardDeps {
  coreStart: CoreStart;
}
const DashboardByRenderer = getPlugins()
  .dashboard
  .DashboardContainerByValueRenderer

const TopNavMenu = getPlugins().navigation.ui.TopNavMenu;
export function DashboardPage(props: DashboardDeps) {
  const [indexPattern, setIndexPattern] = useState<IndexPattern | null>();
  const [config, setDashboardConfig] = useDashboardConfiguration({ id: 'id1', title: 'title1' });
  useEffect(() => {
    const setDefaultIndexPattern = async () => {
      const defaultIndexPattern = await getDataPlugin().indexPatterns.getDefault();
      setIndexPattern(defaultIndexPattern);
    };

    setDefaultIndexPattern();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <EuiSpacer size="s" />
      <EuiText size="m" textAlign="center">
        <h1>{'Metrics'}</h1>
      </EuiText>
      <TopNavMenu
        appName={'metrics'}
        showSearchBar={true}
        useDefaultBehaviors={true}
        indexPatterns={indexPattern ? [indexPattern] : undefined}
      />
      <DashboardByRenderer input={config} onInputUpdated={(newInput)=>{
        console.log(newInput)
        }}>
        <WzKpi title='title' value='34%'></WzKpi>
      </DashboardByRenderer>
      <EuiSpacer size="s" />
      <WzKpi title="Score" value="86%" />
    </div>
  );
}
