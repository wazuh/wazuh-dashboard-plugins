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
import { tscRequirementsFile } from '../../../../common/compliance-requirements/tsc-requirements';
import {
  DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_REQUIREMENT,
  UI_LOGGER_LEVELS,
} from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { withAgentSupportModule } from '../../common/hocs';
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tFilter,
  tParsedIndexPattern,
  useDataSource,
} from '../../common/data-source';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import useSearchBar from '../../common/search-bar/use-search-bar';
import { LoadingSearchbarProgress } from '../../common/loading-searchbar-progress/loading-searchbar-progress';
import { I18nProvider } from '@osd/i18n/react';
import { useAsyncAction } from '../../common/hooks';
import { WzSearchBar } from '../../common/search-bar';

function buildComplianceObject({ section }) {
  try {
    let complianceRequirements = {};
    let descriptions = {};
    let selectedRequirements = {}; // all enabled by default
    if (section === 'pci') {
      descriptions = pciRequirementsFile;
      Object.keys(pciRequirementsFile).forEach((item) => {
        const currentRequirement = item.split('.')[0];
        if (complianceRequirements[currentRequirement]) {
          complianceRequirements[currentRequirement].push(item);
        } else {
          selectedRequirements[currentRequirement] = true;
          complianceRequirements[currentRequirement] = [];
          complianceRequirements[currentRequirement].push(item);
        }
      }); //forEach
    }
    if (section === 'gdpr') {
      descriptions = gdprRequirementsFile;
      Object.keys(gdprRequirementsFile).forEach((item) => {
        const currentRequirement = item.split('_')[0];
        if (complianceRequirements[currentRequirement]) {
          complianceRequirements[currentRequirement].push(item);
        } else {
          selectedRequirements[currentRequirement] = true;
          complianceRequirements[currentRequirement] = [];
          complianceRequirements[currentRequirement].push(item);
        }
      }); //forEach
    }

    if (section === 'hipaa') {
      descriptions = hipaaRequirementsFile;
      Object.keys(hipaaRequirementsFile).forEach((item) => {
        const currentRequirement =
          item.split('.')[0] + '.' + item.split('.')[1] + '.' + item.split('.')[2];
        if (complianceRequirements[currentRequirement]) {
          complianceRequirements[currentRequirement].push(item);
        } else {
          selectedRequirements[currentRequirement] = true;
          complianceRequirements[currentRequirement] = [];
          complianceRequirements[currentRequirement].push(item);
        }
      }); //forEach
    }

    if (section === 'nist') {
      descriptions = nistRequirementsFile;
      Object.keys(nistRequirementsFile).forEach((item) => {
        const currentRequirement = item.split('.')[0];
        if (complianceRequirements[currentRequirement]) {
          complianceRequirements[currentRequirement].push(item);
        } else {
          selectedRequirements[currentRequirement] = true;
          complianceRequirements[currentRequirement] = [];
          complianceRequirements[currentRequirement].push(item);
        }
      }); //forEach
    }
    if (section === 'tsc') {
      descriptions = tscRequirementsFile;
      Object.keys(tscRequirementsFile).forEach((item) => {
        const currentRequirement = item.split('.')[0];
        if (complianceRequirements[currentRequirement]) {
          complianceRequirements[currentRequirement].push(item);
        } else {
          selectedRequirements[currentRequirement] = true;
          complianceRequirements[currentRequirement] = [];
          complianceRequirements[currentRequirement].push(item);
        }
      }); //forEach
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

export const ComplianceTable = withAgentSupportModule((props) => {
  const { DataSource, ...rest } = props;

  const {
    filters,
    dataSource,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });

  const { absoluteDateRange } = searchBarProps;
  const [complianceData, setComplianceData] = useState({
    descriptions: {},
    complianceObject: {},
    selectedRequirements: {},
  });

  const getRegulatoryComplianceRequirementFilter = (key: string, value: string) => {
    if (!value) return [];
    return [
      {
        meta: {
          index: dataSource?.indexPattern.id,
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
          controlledBy: DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_REQUIREMENT,
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

  const getRequirementsCount = async ({ section, query, fetchData, dateRange }) => {
    try {
      const mapFieldAgg = {
        pci: 'rule.pci_dss',
        gdpr: 'rule.gdpr',
        hipaa: 'rule.hipaa',
        nist: 'rule.nist_800_53',
        tsc: 'rule.tsc',
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
        dateRange: absoluteDateRange,
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
    dataSource,
    searchBarProps.query,
    absoluteDateRange,
  ]);

  useEffect(() => {
    const { descriptions, complianceObject, selectedRequirements } = buildComplianceObject({
      section: props.section,
    });
    setComplianceData({ descriptions, complianceObject, selectedRequirements });
  }, []);

  useEffect(() => {
    if (dataSource) {
      action.run({
        section: props.section,
        fetchData,
        query: searchBarProps.query,
        dateRange: absoluteDateRange,
      });
    }
  }, [
    dataSource,
    JSON.stringify(searchBarProps.query),
    JSON.stringify(fetchFilters),
    JSON.stringify(absoluteDateRange),
  ]);

  return (
    <I18nProvider>
      {isDataSourceLoading && !dataSource ? (
        <LoadingSearchbarProgress />
      ) : (
        <>
          <EuiPanel paddingSize="none" hasShadow={false} hasBorder={false} color="transparent">
            <WzSearchBar
              appName="compliance-controls"
              {...searchBarProps}
              fixedFilters={fixedFilters}
              showDatePicker={true}
              showQueryInput={true}
              showQueryBar={true}
              showSaveQuery={true}
            />
          </EuiPanel>
          <EuiPanel paddingSize="s" hasShadow={false} hasBorder={false} color="transparent">
            <EuiPanel paddingSize="none">
              <EuiFlexGroup paddingSize="none">
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
                        }}
                      >
                        <ComplianceRequirements
                          section={props.section}
                          onChangeSelectedRequirements={(selectedRequirements) =>
                            setComplianceData((state) => ({
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
                          onSelectedTabChanged={(id) => props.onSelectedTabChanged(id)}
                          requirementsCount={action.data || []}
                          loadingAlerts={action.running}
                          fetchFilters={fetchFilters}
                          getRegulatoryComplianceRequirementFilter={
                            getRegulatoryComplianceRequirementFilter
                          }
                          {...complianceData}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  )}
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiPanel>
        </>
      )}
    </I18nProvider>
  );
});
