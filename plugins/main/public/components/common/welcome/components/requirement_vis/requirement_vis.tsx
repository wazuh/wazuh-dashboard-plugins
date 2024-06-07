/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
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

import React, { useCallback } from 'react';
import { EuiFlexItem, EuiPanel, euiPaletteColorBlind } from '@elastic/eui';
import { VisualizationBasicWidgetSelector } from '../../../charts/visualizations/basic';
import { getRequirementAlerts } from './lib';
import { useTimeFilter } from '../../../hooks';
import { AppState } from '../../../../../react-services';
import { WAZUH_MODULES } from '../../../../../../common/wazuh-modules';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../data-source/pattern/pattern-data-source-filter-manager';
import NavigationService from '../../../../../react-services/navigation-service';

const selectionOptionsCompliance = [
  { value: 'pci_dss', text: 'PCI DSS' },
  { value: 'gdpr', text: 'GDPR' },
  { value: 'nist_800_53', text: 'NIST 800-53' },
  { value: 'hipaa', text: 'HIPAA' },
  { value: 'gpg13', text: 'GPG13' },
  { value: 'tsc', text: 'TSC' },
];

const requirementNameModuleID = {
  pci_dss: 'pci',
  gdpr: 'gdpr',
  nist_800_53: 'nist',
  hipaa: 'hipaa',
  gpg13: '',
  tsc: 'tsc',
};

export function RequirementVis(props) {
  const colors = euiPaletteColorBlind();
  const { timeFilter } = useTimeFilter();
  const pinnedAgentManager = new PinnedAgentManager();

  const goToDashboardWithFilter = async (requirement, key, agent) => {
    pinnedAgentManager.pinAgent(agent);
    const indexPatternId = AppState.getCurrentPattern();
    const filters = [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        `rule.${requirement}`,
        key,
        indexPatternId,
      ),
    ];
    const tabName = requirementNameModuleID[requirement];
    const params = `tab=${tabName}&agentId=${
      agent.id
    }&_g=${PatternDataSourceFilterManager.filtersToURLFormat(filters)}`;
    NavigationService.getInstance().navigateToApp(
      WAZUH_MODULES[tabName].appId,
      {
        path: `#/overview?${params}`,
      },
    );
  };

  const fetchData = useCallback(
    async (selectedOptionValue, timeFilter, agent) => {
      const buckets = await getRequirementAlerts(
        agent.id,
        timeFilter,
        selectedOptionValue,
      );
      return buckets?.length
        ? buckets.map(({ key, doc_count }, index) => ({
            label: key,
            value: doc_count,
            color: colors[index],
            onClick:
              selectedOptionValue === 'gpg13'
                ? undefined
                : () =>
                    goToDashboardWithFilter(selectedOptionValue, key, agent),
          }))
        : null;
    },
    [],
  );

  return (
    <EuiFlexItem>
      <EuiPanel paddingSize='m'>
        <VisualizationBasicWidgetSelector
          type='donut'
          size={{ width: '100%', height: '200px' }}
          showLegend
          title='Compliance'
          selectorOptions={selectionOptionsCompliance}
          onFetch={fetchData}
          onFetchExtraDependencies={[timeFilter, props.agent]}
          noDataTitle='No results'
          noDataMessage={(_, optionRequirement) =>
            `No ${optionRequirement.text} results were found in the selected time range.`
          }
        />
      </EuiPanel>
    </EuiFlexItem>
  );
}
