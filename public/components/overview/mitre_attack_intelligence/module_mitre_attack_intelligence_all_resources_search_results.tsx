/*
 * Wazuh app - React component that shows the searching resutls of Mitre Att&ck resources
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
  EuiAccordion,
  EuiButtonEmpty,
  EuiCallOut,
  EuiProgress,
  EuiSpacer
} from '@elastic/eui';

import { withGuard } from '../../../components/common/hocs';

const LoadingProgress = () => (
  <EuiProgress color='primary' size='s'/>
);

export const ModuleMitreAttackIntelligenceAllResourcesSearchResults = withGuard(({loading}) => loading, LoadingProgress)(({ results }) => {
  const thereAreResults = results && results.length > 0;
  return thereAreResults
  ? results.map(item => (
    <EuiAccordion
      key={`module_mitre_attack_intelligence_all_resources_search_results_${item.name}`}
      style={{ textDecoration: 'none' }}
      id=''
      buttonContent={<span>{item.name} ({item.results.length})</span>}
      paddingSize='none'
      initialIsOpen={true}
    >
      {item.results.map((result, resultIndex) => (
        <EuiButtonEmpty
          key={`module_mitre_attack_intelligence_all_resources_search_results_${item.name}_${resultIndex}`}
        >
          {result[item.fieldName]}
        </EuiButtonEmpty>
      ))}
    </EuiAccordion>
  ), []).reduce((accum, cur) => [accum, <EuiSpacer size='m'/>, cur])
  :  <EuiCallOut
        title='No results found'
        color='warning'
      />
});
