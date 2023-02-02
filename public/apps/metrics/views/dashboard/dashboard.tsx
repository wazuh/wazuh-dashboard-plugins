/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

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
        onFiltersUpdated={() => {setDashboardConfig()}}
        onQueryChange={() => {setDashboardConfig()}}
        appName={'metrics'}
        showSearchBar={true}
        useDefaultBehaviors={true}
        indexPatterns={indexPattern ? [indexPattern] : undefined}
      />
      <DashboardByRenderer input={config} onInputUpdated={(newInput)=>{
        console.log(newInput)
        // setDashboardConfig()
        }}>
        <WzKpi title='title' value='34%'></WzKpi>
      </DashboardByRenderer>
      <EuiSpacer size="s" />
      <WzKpi title="Score" value="86%" />
    </div>
  );
}
