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
  EuiSuperSelect,
  EuiLoadingSpinner,
  EuiProgress,
  EuiBasicTable,
  EuiButtonIcon
} from '@elastic/eui';

const app = uiModules.get('app/wazuh', ['react']);

app
  .value('EuiIcon', EuiIcon)
  .value('EuiSuperSelect', EuiSuperSelect)
  .value('EuiLoadingSpinner', EuiLoadingSpinner)
  .value('EuiProgress', EuiProgress)
  .value('EuiButtonIcon', EuiButtonIcon)
  .value('EuiBasicTable', EuiBasicTable);
