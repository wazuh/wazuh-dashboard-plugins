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
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiIcon,
  EuiText,
  EuiSuperSelect,
  EuiLoadingSpinner,
  EuiProgress,
  EuiBasicTable,
  EuiButtonIcon,
  EuiButtonToggle,
  EuiButtonEmpty,
  EuiFieldText,
  EuiCodeBlock,
  EuiTitle,
  EuiCopy,
  Fragment
} from '@elastic/eui';

const app = uiModules.get('app/wazuh', ['react']);

import { WazuhRegisterAgents } from './register-agents';

app
  .value('EuiFlexGroup', EuiFlexGroup)
  .value('EuiFlexItem', EuiFlexItem)
  .value('EuiPanel', EuiPanel)
  .value('EuiIcon', EuiIcon)
  .value('EuiText', EuiText)
  .value('EuiSuperSelect', EuiSuperSelect)
  .value('EuiLoadingSpinner', EuiLoadingSpinner)
  .value('EuiProgress', EuiProgress)
  .value('EuiButtonIcon', EuiButtonIcon)
  .value('EuiButtonToggle', EuiButtonToggle)
  .value('EuiButtonEmpty', EuiButtonEmpty)
  .value('EuiBasicTable', EuiBasicTable)
  .value('EuiFieldText', EuiFieldText)
  .value('EuiCodeBlock', EuiCodeBlock)
  .value('EuiTitle ', EuiTitle)
  .value('Fragment', Fragment)
  .value('EuiCopy', EuiCopy)
  .value('WazuhRegisterAgents', WazuhRegisterAgents);

