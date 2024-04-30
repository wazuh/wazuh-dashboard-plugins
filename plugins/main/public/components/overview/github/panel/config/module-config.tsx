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

export type ModuleConfigProps = {
  fetchData: (params: any) => void;
  fetchFilters: any[];
  searchBarProps: tUseSearchBarProps;
  indexPattern: IndexPattern;
};

export const ModuleConfig = (moduleProps: ModuleConfigProps) => {
  return {
    main: {
      component: props => <Main {...{ ...MainViewConfig, ...props }} />,
    },
    'data.github.actor': {
      component: props => (
        <Drilldown
          title={'Actor Activity'}
          {...{ ...DrilldownConfigActor(moduleProps), ...props }}
        />
      ),
    },
    'data.github.org': {
      component: props => (
        <Drilldown
          title={'Organization Activity'}
          {...{ ...DrilldownConfigOrganization(moduleProps), ...props }}
        />
      ),
    },
    'data.github.repo': {
      component: props => (
        <Drilldown
          title={'Repository Activity'}
          {...{ ...DrilldownConfigRepository(moduleProps), ...props }}
        />
      ),
    },
    'data.github.action': {
      component: props => (
        <Drilldown
          title={'Action Activity'}
          {...{ ...DrilldownConfigAction(moduleProps), ...props }}
        />
      ),
    },
  };
};
