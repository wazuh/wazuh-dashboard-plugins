/*
 * Wazuh app - GitHub Panel tab - Views configurations
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import { Main, Drilldown } from '../views';
import { MainViewConfig, DrilldownConfig } from './';

export const ModuleConfig = {
  main: {
    length: () => MainViewConfig.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <Main {...{ ...MainViewConfig, ...props }} />
  },
  drilldown: {
    length: () => DrilldownConfig.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <Drilldown {...{ ...DrilldownConfig, ...props }} />
  }
};
