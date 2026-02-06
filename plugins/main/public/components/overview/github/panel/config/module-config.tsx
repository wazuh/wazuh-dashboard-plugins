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
import {
  MainViewConfig,
  DrilldownConfigAction,
  DrilldownConfigActor,
  DrilldownConfigOrganization,
  DrilldownConfigRepository,
} from './';
import { tUseSearchBarProps } from '../../../common/search-bar/use-search-bar';
import { IndexPattern } from '../../../../../../src/plugins/data/public';

export const ModuleConfig = {
  main: {
    component: props => {
      return <Main {...{ ...MainViewConfig(props), ...props }} />;
    },
  },
  'user.name': {
    component: props => (
      <Drilldown
        title={'Actor Activity'}
        {...{ ...DrilldownConfigActor(props), ...props }}
      />
    ),
  },
  'organization.name': {
    component: props => (
      <Drilldown
        title={'Organization Activity'}
        {...{ ...DrilldownConfigOrganization(props), ...props }}
      />
    ),
  },
  'github.audit.repo': {
    component: props => (
      <Drilldown
        title={'Repository Activity'}
        {...{ ...DrilldownConfigRepository(props), ...props }}
      />
    ),
  },
  'event.action': {
    component: props => (
      <Drilldown
        title={'Action Activity'}
        {...{ ...DrilldownConfigAction(props), ...props }}
      />
    ),
  },
};
