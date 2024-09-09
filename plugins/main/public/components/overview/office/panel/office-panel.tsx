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

import React, { useState, useEffect, useCallback } from 'react';
import { MainPanel } from '../../../common/modules/panel';
import { withErrorBoundary } from '../../../common/hocs';
import { CustomSearchBar } from '../../../common/custom-search-bar';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';
import { ModuleConfiguration } from './views';
import { ModuleConfig, filtersValues } from './config';
import {
  AlertsDataSourceRepository,
  FILTER_OPERATOR,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { Office365DataSource } from '../../../common/data-source/pattern/alerts/office-365/office-365-data-source';
import { IndexPattern } from '../../../../../../src/plugins/data/public';

export const OfficePanel = withErrorBoundary(() => {
  const [drillDownValue, setDrillDownValue] = useState({
    field: '',
    value: '',
  });
  const [currentSelectedFilter, setCurrentSelectedFilter] = useState();
  const [selectedPanelFilter, setSelectedPanelFilter] = useState([]);
  const filterDrillDownValue = (value) => {
    setDrillDownValue(value);
  };
  const {
    filters,
    dataSource,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
    filterManager,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: Office365DataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });

  const handleChangeView = (selectedFilter) => {
    if (!selectedFilter) {
      return;
    }

    const { field, value } = selectedFilter;
    const controlledByFilter = 'office-panel-row-filter';
    if (value) {
      const filter = filterManager?.createFilter(
        FILTER_OPERATOR.IS_ONE_OF,
        field,
        [value],
        controlledByFilter
      );
      // this hide the remove filter button in the filter bar
      setSelectedPanelFilter([filter]);
    } else {
      setSelectedPanelFilter([]);
    }
    setCurrentSelectedFilter(selectedFilter);
  };

  return (
    <>
      {isDataSourceLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <CustomSearchBar
            filterInputs={filtersValues}
            filterDrillDownValue={drillDownValue}
            fixedFilters={[...fixedFilters, ...selectedPanelFilter]}
            searchBarProps={{ ...searchBarProps }}
            setFilters={setFilters}
            indexPattern={dataSource?.indexPattern}
          />
          <MainPanel
            moduleConfig={ModuleConfig}
            filterDrillDownValue={filterDrillDownValue}
            sidePanelChildren={<ModuleConfiguration />}
            onChangeView={handleChangeView}
            dataSourceProps={{
              fetchData,
              fetchFilters: [...fetchFilters, ...selectedPanelFilter],
              searchBarProps,
              indexPattern: dataSource?.indexPattern,
            }}
            isLoading={isDataSourceLoading}
          />
        </>
      )}
    </>
  );
});
