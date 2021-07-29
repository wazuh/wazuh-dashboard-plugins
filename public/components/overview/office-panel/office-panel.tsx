/*
 * Wazuh app - Office 365 Panel react component.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState } from 'react';
import { MainPanel } from '../../common/modules/panel';
import { withErrorBoundary } from '../../common/hocs';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { CustomSearchBar } from '../../common/custom-search-bar';
import { OfficeStats } from './views';
import { queryConfig } from '../../../react-services/query-config';
import { ModuleConfig, filtersValues } from './config';

export const OfficePanel = withErrorBoundary(() => {

  const [moduleStatsList, setModuleStatsList] = useState([]);

  /** Get Office 365 Side Panel Module info **/
  const getModuleConfig = async () => {
    const modulesConfig = await queryConfig(
      '000',
      [{ component: 'wmodules', configuration: 'wmodules' }]
    );
    const config = Object.entries(modulesConfig["wmodules-wmodules"].affected_items[0].wmodules
      .filter((module) => { return Object.keys(module)[0] == 'office365' })[0]['office365']).map((configProp) => {
        const description = Array.isArray(configProp[1]) ? configProp[1].join(', ') : configProp[1];
        return { title: configProp[0], description }
      })
    setModuleStatsList(config);
  }

  useEffect(() => {
    (async () => {
      try {
        await getModuleConfig();
      } catch (error) {
        const options = {
          context: `${OfficePanel.name}.getModuleConfig`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: 'Module Unavailable',
          },
        };
        getErrorOrchestrator().handleError(options);
        setModuleStatsList([{ title: 'Module Unavailable', description: '' }]);
      }
    }
    )();
  }, [])

  return (
    <>
      <CustomSearchBar filtersValues={filtersValues} />
      <MainPanel moduleConfig={ModuleConfig} tab={'office'}
        sidePanelChildren={<OfficeStats listItems={moduleStatsList} />} />
    </>
  )
});
