/*
 * Wazuh app - Wrap EUI components with ng-react and the Wazuh app
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
  EuiSpacer
} from '@elastic/eui';

import { BasicTable } from '../directives/wz-table-eui/components/table';
import { Tabs } from '../directives/wz-tabs-eui/components/tabs';
import { Logtest } from '../directives/wz-logtest/components/logtest';
import { ToolsWelcomeCards } from '../controllers/dev-tools/components/tools-welcome-cards';
import { TestConfiguration } from '../controllers/dev-tools/components/test-configuration';
import { ModulesGuide } from '../controllers/management/components/modules-guide';

const app = uiModules.get('app/wazuh', ['react']);

app
  .value('EuiIcon', EuiIcon)
  .value('EuiTextArea', EuiTextArea)
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
  .value('Logtest', Logtest)
  .value('ToolsWelcomeCards', ToolsWelcomeCards)
  .value('TestConfiguration', TestConfiguration)
  .value('EuiSwitch', EuiSwitch)
  .value('EuiSpacer',EuiSpacer)
  .value('ModulesGuide', ModulesGuide)
  .value('EuiSwitch', EuiSwitch);
