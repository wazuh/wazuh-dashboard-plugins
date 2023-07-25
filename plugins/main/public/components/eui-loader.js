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
import 'react';
import {
  EuiIcon,
  EuiTextArea,
  EuiSuperSelect,
  EuiLoadingSpinner,
  EuiProgress,
  EuiBasicTable,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiHealth,
  EuiCallOut,
  EuiSwitch,
  EuiSpacer,
  EuiEmptyPrompt,
  EuiLoadingChart
} from '@elastic/eui';

import { Tabs } from './common/tabs/tabs';
import { MultipleAgentSelector } from './management/groups/multiple-agent-selector';
import { NodeList } from './management/cluster/node-list';
import { HealthCheck } from './health-check';
import { WzEmptyPromptNoPermissions } from './common/permissions/prompt';
import { getAngularModule } from '../kibana-services';
import { Logtest } from '../directives/wz-logtest/components/logtest';

const app = getAngularModule();

app
  .value('EuiIcon', EuiIcon)
  .value('EuiTextArea', EuiTextArea)
  .value('EuiEmptyPrompt', EuiEmptyPrompt)
  .value('EuiSuperSelect', EuiSuperSelect)
  .value('EuiLoadingSpinner', EuiLoadingSpinner)
  .value('EuiProgress', EuiProgress)
  .value('EuiButtonIcon', EuiButtonIcon)
  .value('EuiButtonEmpty', EuiButtonEmpty)
  .value('EuiBasicTable', EuiBasicTable)
  .value('EuiHealth', EuiHealth)
  .value('EuiCallOut', EuiCallOut)
  .value('Tabs', Tabs)
  .value('EuiSwitch', EuiSwitch)
  .value('EuiSpacer', EuiSpacer)
  .value('EuiSpacer', EuiSpacer)
  .value('EuiLoadingChart', EuiLoadingChart)
  .value('MultipleAgentSelector', MultipleAgentSelector)
  .value('NodeList', NodeList)
  .value('HealthCheck', HealthCheck)
  .value('WzEmptyPromptNoPermissions', WzEmptyPromptNoPermissions)
  .value('Logtest', Logtest)
