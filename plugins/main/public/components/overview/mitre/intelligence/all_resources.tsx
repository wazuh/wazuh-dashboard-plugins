/*
 * Wazuh app - React component for show all resources.
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

import React, {useCallback, useState} from 'react';
import { 
  EuiTitle,
  EuiSpacer
} from '@elastic/eui';
import { ModuleMitreAttackIntelligenceAllResourcesSearchResults } from './all_resources_search_results';
import { ModuleMitreAttackIntelligenceFlyout } from './resource_detail_flyout';

export const ModuleMitreAttackIntelligenceAllResources = ({ results, loading }) => {
  const [details, setDetails] = useState(null);

  const selectResource = useCallback((item) => {
    setDetails(item);
  },[]);

  const closeFlyout = useCallback(() => {
    setDetails(null);
  },[]);

  return (
    <>
      <EuiTitle><h1>Search results</h1></EuiTitle>
      <EuiSpacer />
      <ModuleMitreAttackIntelligenceAllResourcesSearchResults results={results} loading={loading} onSelectResource={selectResource}/> 

      {details && (
        <ModuleMitreAttackIntelligenceFlyout
          details={details}
          closeFlyout={() => closeFlyout()}
          onSelectResource={setDetails}
        />
      )}
    </>
  )
};
