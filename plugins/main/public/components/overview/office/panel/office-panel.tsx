/*
 * Wazuh app - Office 365 Panel react component.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { MainPanel } from '../../../common/modules/panel';
import { ModuleConfiguration } from './views';
import { ModuleConfig, filtersValues } from './config';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { Office365DataSource } from '../../../common/data-source/pattern/alerts/office-365/office-365-data-source';
import { createPanel } from '../../../common/dashboards';

export const OfficePanel = createPanel({
  DataSource: Office365DataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  MainPanel,
  ModuleConfiguration,
  ModuleConfig,
  filtersValues,
});
