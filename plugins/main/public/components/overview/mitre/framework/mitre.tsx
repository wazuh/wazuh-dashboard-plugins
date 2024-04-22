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
import { I18nProvider } from '@osd/i18n/react';
import { Tactics, Techniques } from './components';
import { EuiPanel, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import {
  Query,
  IndexPattern,
} from '../../../../../../../src/plugins/data/common';
import { getPlugins } from '../../../../kibana-services';
import { withErrorBoundary } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import {
  useDataSource,
  MitreAttackDataSource,
  AlertsDataSourceRepository,
  tParsedIndexPattern,
  PatternDataSource,
  tFilter,
} from '../../../common/data-source';
export interface ITactic {
  [key: string]: string[];
}

const SearchBar = getPlugins().data.ui.SearchBar;

export type tFilterParams = {
  filters: tFilter[];
  query: Query | undefined;
  time: {
    to: string | undefined;
    from: string | undefined;
  };
};

type tMitreState = {
  tacticsObject: ITactic;
  selectedTactics: Object;
};

const MitreComponent = props => {
  const { onSelectedTabChanged } = props;
  const {
    filters,
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: MitreAttackDataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters: setFilters,
  });
  const [mitreState, setMitreState] = useState<tMitreState>({
    tacticsObject: {},
    selectedTactics: {},
  });

  const [filterParams, setFilterParams] = useState<tFilterParams>({
    filters: fetchFilters,
    query: searchBarProps?.query,
    time: {
      from: searchBarProps?.dateRangeFrom,
      to: searchBarProps?.dateRangeTo,
    },
  });
  const [indexPattern, setIndexPattern] = useState<any>(); //Todo: Add correct type
  const [isLoading, setIsLoading] = useState(true);

  const initialize = async () => {
    setIndexPattern(dataSource?.indexPattern);
    let filterParams = {
      filters: fetchFilters, // pass the fetchFilters to use it as initial filters in the technique flyout
      query: searchBarProps?.query,
      time: {
        from: searchBarProps?.dateRangeFrom,
        to: searchBarProps?.dateRangeTo,
      },
    };
    setFilterParams(filterParams);
    setIsLoading(true);
    await buildTacticsObject();
  };

  useEffect(() => {
    if (isDataSourceLoading || !dataSource) return;
    initialize();
  }, [
    isDataSourceLoading,
    dataSource,
    searchBarProps.query,
    searchBarProps.dateRangeFrom,
    searchBarProps.dateRangeTo,
    JSON.stringify(filters),
  ]);

  const buildTacticsObject = async () => {
    try {
      const data = await WzRequest.apiReq('GET', '/mitre/tactics', {});
      const result = (((data || {}).data || {}).data || {}).affected_items;
      const tacticsObject = {};
      result &&
        result.forEach(item => {
          tacticsObject[item.name] = item;
        });
      setMitreState({ ...mitreState, tacticsObject });
      setIsLoading(false);
    } catch (error) {
      setMitreState({ ...mitreState });
      setIsLoading(false);
      const options = {
        context: `${Mitre.name}.buildTacticsObject`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Mitre data could not be fetched`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  const onChangeSelectedTactics = selectedTactics => {
    setMitreState({ ...mitreState, selectedTactics });
  };

  const flexGroupStyle = {
    margin: '0 8px',
  };

  return (
    <div>
      <I18nProvider>
        <EuiFlexGroup style={flexGroupStyle}>
          <EuiFlexItem>
            {isDataSourceLoading && !dataSource ? (
              <LoadingSpinner />
            ) : (
              <div className='wz-discover hide-filter-control wz-search-bar'>
                <SearchBar
                  appName='mitre-attack-searchbar'
                  {...searchBarProps}
                  showQueryInput={true}
                  showQueryBar={true}
                  showSaveQuery={true}
                />
              </div>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup style={flexGroupStyle}>
          <EuiFlexItem>
            <EuiPanel paddingSize='none'>
              <EuiFlexGroup>
                <EuiFlexItem
                  grow={false}
                  style={{
                    width: '15%',
                    minWidth: 145,
                    height: 'calc(100vh - 325px)',
                    overflowX: 'hidden',
                  }}
                >
                  <Tactics
                    onChangeSelectedTactics={onChangeSelectedTactics}
                    filterParams={filterParams}
                    tacticsObject={mitreState.tacticsObject}
                    selectedTactics={mitreState.selectedTactics}
                    fetchData={fetchData}
                    isLoading={isLoading}
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <Techniques
                    indexPatternId={indexPattern?.id}
                    filterParams={filterParams}
                    onSelectedTabChanged={id => onSelectedTabChanged(id)}
                    tacticsObject={mitreState.tacticsObject}
                    selectedTactics={mitreState.selectedTactics}
                    fetchData={fetchData}
                    isLoading={isLoading}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </I18nProvider>
    </div>
  );
};

export const Mitre = withErrorBoundary(MitreComponent);
