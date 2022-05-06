/*
 * Wazuh app - GitHub Panel tab - Views configurations
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
import { Main, Drilldown } from '../views';
import { MainViewConfig, DrilldownConfigAction, DrilldownConfigActor, DrilldownConfigOrganization, DrilldownConfigRepository } from './';

export const ModuleConfig = {
  main: {
    length: () => MainViewConfig.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <Main {...{ ...MainViewConfig, ...props }} />
  },
  'data.github.actor': {
    length: () => DrilldownConfigActor.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <Drilldown title={"Actor Activity"} {...{ ...DrilldownConfigActor, ...props }} />
  },
  'data.github.org': {
    length: () => DrilldownConfigOrganization.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <Drilldown title={"Organization Activity"} {...{ ...DrilldownConfigOrganization, ...props }} />
  },
  'data.github.repo': {
    length: () => DrilldownConfigRepository.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <Drilldown title={"Repository Activity"} {...{ ...DrilldownConfigRepository, ...props }} />
  },
  'data.github.action': {
    length: () => DrilldownConfigAction.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <Drilldown title={"Action Activity"} {...{ ...DrilldownConfigAction, ...props }} />
  },
};
