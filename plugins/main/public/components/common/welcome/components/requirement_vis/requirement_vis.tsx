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
import { euiPaletteColorBlind } from '@elastic/eui';
import {
  useVisualizationBasicWidgetSelector,
  VisualizationBasicWidgetSelectorBody,
  VisualizationBasicWidgetSelectorHeader,
} from '../../../charts/visualizations/basic';
import { useTimeFilter } from '../../../hooks';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../data-source/pattern/pattern-data-source-filter-manager';
import NavigationService from '../../../../../react-services/navigation-service';
import {
  withDataSource,
  withDataSourceInitiated,
  withDataSourceLoading,
  withPanel,
} from '../../../hocs';
import {
  FindingsDataSourceRepository,
  ThreatHuntingDataSource,
} from '../../../data-source';
import { LoadingSearchbarProgress } from '../../../loading-searchbar-progress/loading-searchbar-progress';
import { compose } from 'redux';
import { regulatoryCompliance } from '../../../../../utils/applications';
import { WAZUH_MODULES_ID } from '../../../../../../common/constants';

const selectionOptionsCompliance = [
  { value: 'cmmc', text: 'CMMC' },
  { value: 'fedramp', text: 'FedRAMP' },
  { value: 'gdpr', text: 'GDPR' },
  { value: 'hipaa', text: 'HIPAA' },
  { value: 'iso_27001', text: 'ISO 27001' },
  { value: 'nis2', text: 'NIS2' },
  { value: 'nist_800_53', text: 'NIST 800-53' },
  { value: 'nist_800_171', text: 'NIST 800-171' },
  { value: 'pci_dss', text: 'PCI DSS' },
  { value: 'tsc', text: 'TSC' },
];

const requirementNameModuleID = {
  cmmc: WAZUH_MODULES_ID.CMMC,
  fedramp: WAZUH_MODULES_ID.FEDRAMP,
  gdpr: WAZUH_MODULES_ID.GDPR,
  hipaa: WAZUH_MODULES_ID.HIPAA,
  iso_27001: WAZUH_MODULES_ID.ISO_27001,
  nis2: WAZUH_MODULES_ID.NIS2,
  nist_800_53: WAZUH_MODULES_ID.NIST_800_53,
  nist_800_171: WAZUH_MODULES_ID.NIST_800_171,
  pci_dss: WAZUH_MODULES_ID.PCI_DSS,
  tsc: WAZUH_MODULES_ID.TSC,
};

export const RequirementVis = withPanel({ paddingSize: 'm' })(props => {
  const { selectedOption, onChange } = useVisualizationBasicWidgetSelector(
    selectionOptionsCompliance,
    'pci_dss', // default option
  );

  return (
    <>
      <VisualizationBasicWidgetSelectorHeader
        title='Compliance'
        selectorOptions={selectionOptionsCompliance}
        selectedOption={selectedOption}
        onChange={onChange}
      ></VisualizationBasicWidgetSelectorHeader>
      <RequirementVisBody
        selectedOption={selectedOption}
        selectorOptions={selectionOptionsCompliance}
        agent={props.agent}
      ></RequirementVisBody>
    </>
  );
});

const RequirementVisBody = compose(
  withDataSource({
    DataSource: ThreatHuntingDataSource,
    DataSourceRepositoryCreator: FindingsDataSourceRepository,
  }),
  withDataSourceLoading({
    isLoadingNameProp: 'dataSource.isLoading',
    LoadingComponent: LoadingSearchbarProgress,
  }),
  withDataSourceInitiated({
    isLoadingNameProp: 'dataSource.isLoading',
    dataSourceErrorNameProp: 'dataSource.error',
    dataSourceNameProp: 'dataSource.dataSource',
  }),
)(props => {
  const colors = euiPaletteColorBlind();
  const { timeFilter } = useTimeFilter();
  const pinnedAgentManager = new PinnedAgentManager();

  const goToDashboardWithFilter = async (requirement, key, agent) => {
    pinnedAgentManager.pinAgent(agent);
    const filters = [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        `wazuh.rule.compliance.${requirement}`,
        key,
        props.dataSource.dataSource.indexPattern.id,
      ),
    ];
    const tabName = requirementNameModuleID[requirement];
    const params = `tab=${
      regulatoryCompliance.id
    }&tabView=${tabName}&tabSubView=dashboard&agentId=${
      agent.id
    }&_g=${PatternDataSourceFilterManager.filtersToURLFormat(filters)}`;
    NavigationService.getInstance().navigateToApp(regulatoryCompliance.id, {
      path: `#/overview?${params}`,
    });
  };

  const fetchData = useCallback(
    async (selectedOptionValue, timeFilter, agent) => {
      const response = await props.dataSource.fetchData({
        dateRange: timeFilter,
        filters: [
          ...props.dataSource.fetchFilters,
          PatternDataSourceFilterManager.createFilter(
            FILTER_OPERATOR.EXISTS,
            `wazuh.rule.compliance.${selectedOptionValue}`,
            null,
            props.dataSource.dataSource.indexPattern.id,
          ),
        ],
        pagination: {
          pageIndex: 0,
          pageSize: 1 /* WORKAROUND: the hits are not required, only the aggregations, but this uses a fallback value if this is falsy. See search function in
          plugins/main/public/components/common/search-bar/search-bar-service.ts */,
        },
        aggs: {
          top_alerts_compliance: {
            terms: {
              field: `wazuh.rule.compliance.${selectedOptionValue}`,
              size: 5,
            },
          },
        },
      });

      const buckets = response?.aggregations?.top_alerts_compliance?.buckets;

      return buckets?.length
        ? buckets.map(({ key, doc_count }, index) => ({
            label: key,
            value: doc_count,
            color: colors[index],
            onClick: () =>
              goToDashboardWithFilter(selectedOptionValue, key, agent),
          }))
        : null;
    },
    [],
  );

  return (
    <VisualizationBasicWidgetSelectorBody
      type='donut'
      size={{ width: '100%', height: '200px' }}
      showLegend
      selectorOptions={selectionOptionsCompliance}
      onFetch={fetchData}
      onFetchExtraDependencies={[timeFilter, props.agent]}
      noDataTitle='No results'
      noDataMessage={(_, optionRequirement) =>
        `No ${optionRequirement.text} results were found in the selected time range.`
      }
      selectedOption={props.selectedOption}
      selectorOptions={props.selectorOptions}
    />
  );
});
