/*
 * Wazuh app - Office 365 Panel react component.
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

import React, { useState } from 'react';
import { MainPanel } from '../../../common/modules/panel';
import { withErrorBoundary } from '../../../common/hocs';
import { CustomSearchBar } from '../../../common/custom-search-bar';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';
import { ModuleConfiguration } from './views';
import { ModuleConfig, filtersValues } from './config';
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { GitHubDataSource } from '../../../common/data-source/pattern/alerts/github/github-data-source';
import { IndexPattern } from '../../../../../../src/plugins/data/public';

export const GitHubPanel = withErrorBoundary(() => {
  const [drillDownValue, setDrillDownValue] = useState({
    field: '',
    value: '',
  });
  const [currentSelectedFilter, setCurrentSelectedFilter] = useState();
  const filterDrillDownValue = value => {
    setDrillDownValue(value);
  };

  const {
    filters,
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
    filterManager
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: GitHubDataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });


  const handleChangeView = selectedFilter => {
    if (!selectedFilter) {
      return;
    }

    if (selectedFilter?.value) {
      const filter = filterManager.createFilter(selectedFilter.field, selectedFilter.value);
      setFilters([...filters, filter]);
    } else {
      // the previous filter is stored in currentSelectedFilter
      filterManager.removeFilter(currentSelectedFilter.field, currentSelectedFilter.value);
    }
    setCurrentSelectedFilter(selectedFilter);
  }

  return (
    <>
      {isDataSourceLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <CustomSearchBar
            filterInputs={filtersValues}
            filterDrillDownValue={drillDownValue}
            searchBarProps={searchBarProps}
            setFilters={setFilters}
          />
          <MainPanel
            moduleConfig={ModuleConfig({
              fetchData,
              fetchFilters,
              indexPattern: dataSource?.indexPattern as IndexPattern,
              searchBarProps,
            })}
            filterDrillDownValue={filterDrillDownValue}
            sidePanelChildren={<ModuleConfiguration />}
            onChangeView={handleChangeView}
          />
        </>
      )}
    </>
  );
});
