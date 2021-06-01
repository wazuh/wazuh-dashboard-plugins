/*
 * Wazuh app - React component for show all resources.
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

import React from 'react';
import { 
  EuiTitle,
  EuiSpacer
} from '@elastic/eui';
import { withGuard } from'../../../components/common/hocs';
import { ModuleMitreAttackIntelligenceAllResourcesWelcome } from './module_mitre_attack_intelligence_all_resources_welcome';
import { ModuleMitreAttackIntelligenceAllResourcesSearchResults } from './module_mitre_attack_intelligence_all_resources_search_results';

export const ModuleMitreAttackIntelligenceAllResources = withGuard(({didSearch}) => !didSearch, ModuleMitreAttackIntelligenceAllResourcesWelcome)(({ results, loading }) => {
  return (
    <>
      <EuiTitle><h1>Search results</h1></EuiTitle>
      <EuiSpacer />
      <ModuleMitreAttackIntelligenceAllResourcesSearchResults results={results} loading={loading}/> 
    </>
  )
});
