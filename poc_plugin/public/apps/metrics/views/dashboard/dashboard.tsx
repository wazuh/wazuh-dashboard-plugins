import React, { useState, useEffect } from 'react';
import {
  EuiText,
  EuiSpacer,
  EuiListGroup,
} from '@elastic/eui';

// import {
//   getAngularModule,
//   getToasts,
//   getVisualizationsPlugin,
//   getSavedObjects,
//   getDataPlugin,
//   getChrome,
//   getOverlays,
//   getPlugins,
//   getNavigationPlugin
// } from '../../../../kibana-services';
import { AppPluginStartDependencies, ClientConfigType } from '../../types';
import { WzKpi } from '../../components/wz-kpi/wz-kpi';
import { useDashboardConfiguration } from './configuration';


interface DashboardDeps {
  plugins: AppPluginStartDependencies;
}

export function DashboardPage({ plugins }: DashboardDeps) {
  const [indexPattern, setIndexPattern] = useState<IndexPattern | null>();
  const [config, setDashboardConfig] = useDashboardConfiguration({ id: 'id1', title: 'title1' },plugins);

  const DashboardByRenderer = plugins
    .dashboard
    .DashboardContainerByValueRenderer

  const TopNavMenu = plugins.navigation.ui.TopNavMenu;

  useEffect(() => {
    const setDefaultIndexPattern = async () => {
      const defaultIndexPattern = await plugins.data.indexPatterns.getDefault();
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
      <DashboardByRenderer input={config} onInputUpdated={(newInput) => {
        console.log(newInput)
      }}>
        <WzKpi title='title' value='34%'></WzKpi>
      </DashboardByRenderer>
      <EuiSpacer size="s" />
      <WzKpi title="Score" value="86%" />
    </div>
  );
}
