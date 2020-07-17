/*
 * Wazuh app - Wrap EUI components with ng-react and the Wazuh app
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
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

import { BasicTable } from '../directives/wz-table-eui/components/table';
import { SyscheckTable } from '../directives/wz-syscheck-table/components/syscheck-table';
import { Tabs } from '../directives/wz-tabs-eui/components/tabs';
import { WzEuiPrompt } from '../directives/wz-eui-prompt/components/wz-eui-prompt';
import { MultipleAgentSelector } from './management/groups/multiple-agent-selector';

const app = uiModules.get('app/wazuh', ['react']);

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
  .value('BasicTable', BasicTable)
  .value('Tabs', Tabs)
  .value('WzEuiPrompt', WzEuiPrompt)
  .value('EuiSwitch', EuiSwitch)
  .value('EuiSpacer', EuiSpacer)
  .value('SyscheckTable', SyscheckTable)
  .value('EuiSpacer', EuiSpacer)
  .value('EuiLoadingChart', EuiLoadingChart)
  .value('MultipleAgentSelector', MultipleAgentSelector)
