/*
 * Wazuh app - Wrap EUI components with ng-react and the Wazuh app
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import './eui-loader';
import { WzFilterBar } from './wz-filter-bar/wz-filter-bar';
import { WzVisualize } from './visualize/wz-visualize';
import { WzMenuWrapper } from '../components/wz-menu/wz-menu-wrapper';
import { WzAgentSelectorWrapper } from '../components/wz-agent-selector/wz-agent-selector-wrapper';
import { WzBlankScreen } from '../components/wz-blank-screen/wz-blank-screen';
import { ClusterDisabled } from '../components/management/cluster/cluster-disabled';
import { ClusterTimelions } from '../components/management/cluster/cluster-timelions';
import { KibanaVisWrapper } from '../components/management/cluster/cluster-visualization';
import { ToastNotificationsModal } from '../components/notifications/modal';
import { getAngularModule } from '../kibana-services';

const app = getAngularModule();

app.value('WzFilterBar', WzFilterBar);
app.value('WzVisualize', WzVisualize);
app.value('WzMenuWrapper', WzMenuWrapper);
app.value('WzAgentSelectorWrapper', WzAgentSelectorWrapper);
app.value('WzBlankScreen', WzBlankScreen);
app.value('ClusterDisabled', ClusterDisabled);
app.value('ClusterTimelions', ClusterTimelions);
app.value('KibanaVisualization', KibanaVisWrapper);
app.value('ToastNotificationsModal', ToastNotificationsModal);
