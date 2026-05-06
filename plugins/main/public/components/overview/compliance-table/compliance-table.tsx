/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect } from 'react';
import { EuiPanel, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
//@ts-ignore
import { ComplianceRequirements } from './components/requirements';
import { ComplianceSubrequirements } from './components';
import { pciRequirementsFile } from '../../../../common/compliance-requirements/pci-requirements';
import { gdprRequirementsFile } from '../../../../common/compliance-requirements/gdpr-requirements';
import { hipaaRequirementsFile } from '../../../../common/compliance-requirements/hipaa-requirements';
import { nistRequirementsFile } from '../../../../common/compliance-requirements/nist-requirements';
import { nist171RequirementsFile } from '../../../../common/compliance-requirements/nist-171-requirements';
import { tscRequirementsFile } from '../../../../common/compliance-requirements/tsc-requirements';
import { iso27001RequirementsFile } from '../../../../common/compliance-requirements/iso27001-requirements';
import { cmmcRequirementsFile } from '../../../../common/compliance-requirements/cmmc-requirements';
import { fedrampRequirementsFile } from '../../../../common/compliance-requirements/fedramp-requirements';
import { nis2RequirementsFile } from '../../../../common/compliance-requirements/nis2-requirements';
import {
  DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_REQUIREMENT,
  UI_LOGGER_LEVELS,
  WAZUH_MODULES_ID,
} from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import {
  withAgentSupportModule,
  withDataSourceInitiated,
  withDataSourceLoading,
  withDataSourceSearchBar,
} from '../../common/hocs';
import {
  FindingsDataSourceRepository,
  tFilter,
} from '../../common/data-source';
import { LoadingSearchbarProgress } from '../../common/loading-searchbar-progress/loading-searchbar-progress';
import { I18nProvider } from '@osd/i18n/react';
import { useAsyncAction } from '../../common/hooks';
import { WzSearchBar } from '../../common/search-bar';
import { compose } from 'redux';

function buildComplianceRequirements(
  requirements: { [key: string]: string },
  entriesBySeparator: number = 1,
  separator: string = '.',
) {
  const complianceRequirements = {};
  const selectedRequirements = {};

  Object.keys(requirements).forEach(item => {
    const _splitItem = item.split(separator);
    const currentRequirement = _splitItem
      .slice(0, entriesBySeparator)
      .join(separator);
    if (complianceRequirements[currentRequirement]) {
      complianceRequirements[currentRequirement].push(item);
    } else {
      selectedRequirements[currentRequirement] = true;
      complianceRequirements[currentRequirement] = [];
      complianceRequirements[currentRequirement].push(item);
    }
  });

  return {
    descriptions: requirements,
    selectedRequirements,
    complianceRequirements,
  };
}

function buildComplianceObject({ section }) {
  try {
    let complianceRequirements = {};
    let descriptions = {};
    let selectedRequirements = {}; // all enabled by default
    if (section === WAZUH_MODULES_ID.PCI_DSS) {
      const r = buildComplianceRequirements(pciRequirementsFile, 1, '.');
      complianceRequirements = r.complianceRequirements;
      descriptions = r.descriptions;
      selectedRequirements = r.selectedRequirements;
    }
    if (section === WAZUH_MODULES_ID.GDPR) {
      const r = buildComplianceRequirements(gdprRequirementsFile, 1, '_');
      complianceRequirements = r.complianceRequirements;
      descriptions = r.descriptions;
      selectedRequirements = r.selectedRequirements;
    }

    if (section === WAZUH_MODULES_ID.HIPAA) {
      const r = buildComplianceRequirements(hipaaRequirementsFile, 3, '.');
      complianceRequirements = r.complianceRequirements;
      descriptions = r.descriptions;
      selectedRequirements = r.selectedRequirements;
    }

    if (section === WAZUH_MODULES_ID.NIST_800_53) {
      const r = buildComplianceRequirements(nistRequirementsFile, 1, '-');
      complianceRequirements = r.complianceRequirements;
      descriptions = r.descriptions;
      selectedRequirements = r.selectedRequirements;
    }
    if (section === WAZUH_MODULES_ID.NIST_800_171) {
      const r = buildComplianceRequirements(nist171RequirementsFile, 2, '.');
      complianceRequirements = r.complianceRequirements;
      descriptions = r.descriptions;
      selectedRequirements = r.selectedRequirements;
    }
    if (section === WAZUH_MODULES_ID.TSC) {
      const r = buildComplianceRequirements(tscRequirementsFile, 1, '.');
      complianceRequirements = r.complianceRequirements;
      descriptions = r.descriptions;
      selectedRequirements = r.selectedRequirements;
    }

    if (section === WAZUH_MODULES_ID.ISO_27001) {
      const r = buildComplianceRequirements(iso27001RequirementsFile, 2, '.');
      complianceRequirements = r.complianceRequirements;
      descriptions = r.descriptions;
      selectedRequirements = r.selectedRequirements;
    }

    if (section === WAZUH_MODULES_ID.CMMC) {
      const r = buildComplianceRequirements(cmmcRequirementsFile, 1, '.');
      complianceRequirements = r.complianceRequirements;
      descriptions = r.descriptions;
      selectedRequirements = r.selectedRequirements;
    }

    if (section === WAZUH_MODULES_ID.NIS2) {
      descriptions = nis2RequirementsFile;
      Object.keys(nis2RequirementsFile).forEach(item => {
        const parts = item.split('.');
        let currentRequirement: string;

        // All Art. 23 reporting obligations in one group
        if (parts[0] === '23') {
          currentRequirement = '23';
        } else if (parts.length >= 3 && isNaN(Number(parts[2]))) {
          currentRequirement = parts.slice(0, 3).join('.');
        } else {
          currentRequirement = parts.slice(0, 2).join('.');
        }
        if (complianceRequirements[currentRequirement]) {
          complianceRequirements[currentRequirement].push(item);
        } else {
          selectedRequirements[currentRequirement] = true;
          complianceRequirements[currentRequirement] = [];
          complianceRequirements[currentRequirement].push(item);
        }
      }); // forEach
    }

    if (section === WAZUH_MODULES_ID.FEDRAMP) {
      const r = buildComplianceRequirements(fedrampRequirementsFile, 2, '.');
      complianceRequirements = r.complianceRequirements;
      descriptions = r.descriptions;
      selectedRequirements = r.selectedRequirements;
    }

    return {
      complianceObject: complianceRequirements,
      selectedRequirements,
      descriptions,
    };
  } catch (error) {
    const options = {
      context: 'buildComplianceObject',
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      display: true,
      error: {
        error: error,
        message: error.message || error,
        title: `Compliance (${section}) data could not be fetched`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }
}

export const ComplianceTable = compose(
  withAgentSupportModule,
  withDataSourceSearchBar({
    DataSourceFromNameProp: 'DataSource',
    DataSourceRepositoryCreator: FindingsDataSourceRepository,
  }),
  withDataSourceLoading({
    isLoadingNameProp: 'dataSource.isLoading',
    LoadingComponent: LoadingSearchbarProgress,
  }),
  withDataSourceInitiated({
    dataSourceNameProp: 'dataSource.dataSource',
    isLoadingNameProp: 'dataSource.isLoading',
    dataSourceErrorNameProp: 'dataSource.error',
  }),
)(props => {
  const { dataSource } = props;

  const { searchBarProps, fingerprint, autoRefreshFingerprint } = dataSource;

  const { dateRangeFrom, dateRangeTo } = searchBarProps;
  const [complianceData, setComplianceData] = useState({
    descriptions: {},
    complianceObject: {},
    selectedRequirements: {},
  });

  const getRegulatoryComplianceRequirementFilter = (
    key: string,
    value: string,
  ) => {
    if (!value) return [];
    return [
      {
        meta: {
          index: dataSource.dataSource?.indexPattern.id,
          negate: false,
          disabled: false,
          alias: null,
          type: 'phrase',
          key: key,
          value: value,
          params: {
            query: value,
            type: 'phrase',
          },
          controlledBy:
            DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_REQUIREMENT,
        },
        query: {
          match: {
            [key]: {
              query: value,
              type: 'phrase',
            },
          },
        },
        $state: {
          store: 'appState',
        },
      } as tFilter,
    ];
  };

  const getRequirementsCount = async ({
    section,
    query,
    fetchData,
    dateRange,
  }) => {
    try {
      const mapFieldAgg = {
        [WAZUH_MODULES_ID.CMMC]: 'wazuh.rule.compliance.cmmc',
        [WAZUH_MODULES_ID.FEDRAMP]: 'wazuh.rule.compliance.fedramp',
        [WAZUH_MODULES_ID.GDPR]: 'wazuh.rule.compliance.gdpr',
        [WAZUH_MODULES_ID.HIPAA]: 'wazuh.rule.compliance.hipaa',
        [WAZUH_MODULES_ID.ISO_27001]: 'wazuh.rule.compliance.iso_27001',
        [WAZUH_MODULES_ID.NIS2]: 'wazuh.rule.compliance.nis2',
        [WAZUH_MODULES_ID.NIST_800_53]: 'wazuh.rule.compliance.nist_800_53',
        [WAZUH_MODULES_ID.NIST_800_171]: 'wazuh.rule.compliance.nist_800_171',
        [WAZUH_MODULES_ID.PCI_DSS]: 'wazuh.rule.compliance.pci_dss',
        [WAZUH_MODULES_ID.TSC]: 'wazuh.rule.compliance.tsc',
      };
      const aggs = {
        tactics: {
          terms: {
            field: mapFieldAgg[section],
            size: 100,
          },
        },
      };

      const data = await fetchData({
        aggs,
        query,
        dateRange: dateRange,
      });

      return data?.aggregations?.tactics?.buckets || [];
    } catch (error) {
      const options = {
        context: 'buildComplianceObject',
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Alerts could not be fetched:`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  const action = useAsyncAction(getRequirementsCount, [
    props.section,
    dataSource.dataSource,
    searchBarProps.query,
    { from: dateRangeFrom, to: dateRangeTo },
  ]);

  useEffect(() => {
    const { descriptions, complianceObject, selectedRequirements } =
      buildComplianceObject({
        section: props.section,
      });
    setComplianceData({ descriptions, complianceObject, selectedRequirements });
  }, []);

  useEffect(() => {
    action.run({
      section: props.section,
      fetchData: dataSource.fetchData,
      query: searchBarProps.query,
      dateRange: { from: dateRangeFrom, to: dateRangeTo },
    });
  }, [
    JSON.stringify(searchBarProps.query),
    JSON.stringify(dataSource.fetchFilters),
    dateRangeFrom,
    dateRangeTo,
    fingerprint,
    autoRefreshFingerprint,
  ]);

  return (
    <I18nProvider>
      <>
        <EuiPanel
          paddingSize='none'
          hasShadow={false}
          hasBorder={false}
          color='transparent'
        >
          <WzSearchBar
            appName='compliance-controls'
            {...searchBarProps}
            fixedFilters={dataSource.fixedFilters}
            showDatePicker={true}
            showQueryInput={true}
            showQueryBar={true}
            showSaveQuery={true}
          />
        </EuiPanel>
        <EuiPanel
          paddingSize='s'
          hasShadow={false}
          hasBorder={false}
          color='transparent'
        >
          <EuiPanel paddingSize='none'>
            <EuiFlexGroup paddingSize='none'>
              <EuiFlexItem style={{ width: 'calc(100% - 24px)' }}>
                {!!Object.keys(complianceData.complianceObject).length && (
                  <EuiFlexGroup>
                    <EuiFlexItem
                      grow={false}
                      style={{
                        width: '15%',
                        minWidth: 145,
                        maxHeight: 'calc(100vh - 320px)',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        backgroundColor: '#80808014',
                      }}
                    >
                      <ComplianceRequirements
                        section={props.section}
                        onChangeSelectedRequirements={selectedRequirements =>
                          setComplianceData(state => ({
                            ...state,
                            selectedRequirements,
                          }))
                        }
                        requirementsCount={action.data || []}
                        loadingAlerts={action.running}
                        {...complianceData}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem style={{ width: '15%' }}>
                      <ComplianceSubrequirements
                        section={props.section}
                        onSelectedTabChanged={id =>
                          props.onSelectedTabChanged(id)
                        }
                        requirementsCount={action.data || []}
                        loadingAlerts={action.running}
                        fetchFilters={dataSource.fetchFilters}
                        getRegulatoryComplianceRequirementFilter={
                          getRegulatoryComplianceRequirementFilter
                        }
                        {...complianceData}
                        filters={dataSource.filters}
                        setFilters={dataSource.setFilters}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiPanel>
      </>
    </I18nProvider>
  );
});
