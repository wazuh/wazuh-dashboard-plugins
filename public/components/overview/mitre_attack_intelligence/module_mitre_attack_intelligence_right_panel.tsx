/*
 * Wazuh app - React component for showing the Mitre Att&ck intelligence right panel.
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
import { MitreAttackResources } from './mitre_attack_resources';
import { ModuleMitreAttackIntelligenceAllResources } from './module_mitre_attack_intelligence_all_resources';
import { ModuleMitreAttackIntelligenceResource } from './module_mitre_attack_intelligence_resource';

export const ModuleMitreAttackIntelligenceRightPanel = ({
  loading,
  results,
  resourceFilters,
  selectedResource,
}) => {
  return (
    <>
      {!selectedResource && (
        <ModuleMitreAttackIntelligenceAllResources 
          loading={loading}
          results={results}
        />
      )}
      {MitreAttackResources.map(resource => resource.id === selectedResource
        ? <ModuleMitreAttackIntelligenceResource
            key={`module_mitre_intelligense_resource_${resource.id}`}
            {...resource}
            resourceFilters={resourceFilters}
          />
        : null
      )}
    </>
  )
}
