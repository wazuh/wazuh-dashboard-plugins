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

import React, {useState} from 'react';
import { MainPanel } from '../../common/modules/panel';
import { withErrorBoundary } from '../../common/hocs';
import { CustomSearchBar } from '../../common/custom-search-bar';
import { ModuleConfiguration } from './views';
import { ModuleConfig, filtersValues } from './config';

export const GitHubPanel = withErrorBoundary(() => {
  const [drillDownValue, setDrillDownValue] = useState({ field: '', value: '' });
  const filterDrillDownValue = (value) => {
    setDrillDownValue(value)
  }
  return (
    <>
      <CustomSearchBar filtersValues={filtersValues} filterDrillDownValue={drillDownValue}/>
      <MainPanel moduleConfig={ModuleConfig} tab={'github'}
        filterDrillDownValue={filterDrillDownValue}
        sidePanelChildren={<ModuleConfiguration />} />
    </>
  )
});
