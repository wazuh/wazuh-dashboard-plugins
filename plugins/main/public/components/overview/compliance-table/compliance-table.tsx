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
import React, { Component, useState, useEffect } from 'react';
import { EuiPanel, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { FilterManager } from '../../../../../../src/plugins/data/public/';

//@ts-ignore
import { ComplianceRequirements } from './components/requirements';
import { ComplianceSubrequirements } from './components/subrequirements';
import {
  getElasticAlerts,
  getIndexPattern,
  IFilterParams,
} from '../../../react-services';
import { pciRequirementsFile } from '../../../../common/compliance-requirements/pci-requirements';
import { gdprRequirementsFile } from '../../../../common/compliance-requirements/gdpr-requirements';
import { hipaaRequirementsFile } from '../../../../common/compliance-requirements/hipaa-requirements';
import { nistRequirementsFile } from '../../../../common/compliance-requirements/nist-requirements';
import { tscRequirementsFile } from '../../../../common/compliance-requirements/tsc-requirements';
import { KbnSearchBar } from '../../kbn-search-bar';
import { getDataPlugin, getPlugins } from '../../../kibana-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { withAgentSupportModule } from '../../common/hocs';
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../common/data-source';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import useSearchBar from '../../common/search-bar/use-search-bar';
import { LoadingSpinner } from '../../common/loading-spinner/loading-spinner';
import { I18nProvider } from '@osd/i18n/react';
import { useAsyncAction } from '../../common/hooks';

const SearchBar = getPlugins().data.ui.SearchBar;

function buildComplianceObject({ section }) {
  try {
    let complianceRequirements = {};
    let descriptions = {};
    let selectedRequirements = {}; // all enabled by default
    if (section === 'pci') {
      descriptions = pciRequirementsFile;
      Object.keys(pciRequirementsFile).forEach(item => {
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
      Object.keys(gdprRequirementsFile).forEach(item => {
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
      Object.keys(hipaaRequirementsFile).forEach(item => {
        const currentRequirement =
          item.split('.')[0] +
          '.' +
          item.split('.')[1] +
          '.' +
          item.split('.')[2];
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
      Object.keys(nistRequirementsFile).forEach(item => {
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
      Object.keys(tscRequirementsFile).forEach(item => {
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

export const ComplianceTable = withAgentSupportModule(props => {
  const { DataSource, ...rest } = props;

  const {
    filters,
    dataSource,
    fetchFilters,
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

  const [complianceData, setComplianceData] = useState({
    descriptions: {},
    complianceObject: {},
    selectedRequirements: {},
  });

  const getRequirementsCount = async ({ section, query, fetchData }) => {
    try {
      const mapFieldAgg = {
        pci: 'rule.pci_dss',
        gdpr: 'rule.gdpr',
        hippa: 'rule.hipaa',
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

      const data = await fetchData({ aggs, query });

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
  ]);

  useEffect(() => {
    const { descriptions, complianceObject, selectedRequirements } =
      buildComplianceObject({ section: props.section });
    setComplianceData({ descriptions, complianceObject, selectedRequirements });
  }, []);

  useEffect(() => {
    if (dataSource) {
      action.run({
        section: props.section,
        fetchData,
        query: searchBarProps.query,
      });
    }
  }, [
    dataSource,
    JSON.stringify(searchBarProps.query),
    JSON.stringify(fetchFilters),
  ]);

  return (
    <>
      <I18nProvider>
        <EuiFlexGroup>
          <EuiFlexItem>
            {isDataSourceLoading && !dataSource ? (
              <LoadingSpinner />
            ) : (
              <div className='wz-search-bar hide-filter-control'>
                <SearchBar
                  appName='compliance-controls'
                  {...searchBarProps}
                  showDatePicker={true}
                  showQueryInput={true}
                  showQueryBar={true}
                  showSaveQuery={true}
                />
              </div>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup style={{ margin: '0 8px' }}>
          <EuiFlexItem style={{ width: 'calc(100% - 24px)' }}>
            <EuiPanel paddingSize='none'>
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
                      fetchFilters={fetchFilters}
                      {...complianceData}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              )}
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </I18nProvider>
    </>
  );
});
