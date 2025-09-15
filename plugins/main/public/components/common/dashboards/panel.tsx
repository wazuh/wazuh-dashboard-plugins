/*
 * Wazuh app - Office 365 Panel react component.
 *
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState } from 'react';
import {
  withDataSourceInitiated,
  withDataSourceLoading,
  withDataSourceSearchBar,
  withErrorBoundary,
} from '../hocs';
import { CustomSearchBar } from '../custom-search-bar';
import { LoadingSearchbarProgress } from '../loading-searchbar-progress/loading-searchbar-progress';
import { FILTER_OPERATOR } from '../data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../common/constants';
import { compose } from 'redux';

/**
 * Create a panel dashboard component using minimal dependencies: datasource, sample data warning
 * categories, dashboard panels creator and dashboard metadata.
 *
 * This renders a search bar with a dashboard. Communicate the state with Generate Report button
 * @param param0
 * @returns
 */
export const createPanel = ({
  DataSource,
  DataSourceRepositoryCreator,
  MainPanel,
  ModuleConfiguration,
  ModuleConfig,
  filtersValues,
  sampleDataWarningCategories,
}: {
  DataSource: any;
  DataSourceRepositoryCreator: any;
  sampleDataWarningCategories?: string[];
  MainPanel: React.ComponentType<any>;
  ModuleConfiguration: React.ComponentType<any>;
  ModuleConfig: {
    [key: string]: {
      component: React.ComponentType<any>;
    };
  };
  filtersValues: Array<{
    type: string;
    key: string;
    placeholder: string;
  }>;
}) =>
  compose(
    withErrorBoundary,
    withDataSourceSearchBar({
      DataSource,
      DataSourceRepositoryCreator,
      nameProp: 'dataSource',
    }),
    withDataSourceLoading({
      isLoadingNameProp: 'dataSource.isLoading',
      LoadingComponent: LoadingSearchbarProgress,
    }),
    withDataSourceInitiated({}),
  )(
    ({
      dataSource: {
        dataSource,
        fetchFilters,
        fixedFilters,
        isLoading: isDataSourceLoading,
        fetchData,
        setFilters,
        filterManager,
        searchBarProps,
      },
    }) => {
      const [drillDownValue, setDrillDownValue] = useState({
        field: '',
        value: '',
      });
      const [currentSelectedFilter, setCurrentSelectedFilter] = useState();
      const [selectedPanelFilter, setSelectedPanelFilter] = useState([]);
      const filterDrillDownValue = value => {
        setDrillDownValue(value);
      };

      const handleChangeView = selectedFilter => {
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
            controlledByFilter,
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
          <div className='wz-custom-searchbar-wrapper'>
            <CustomSearchBar
              filterInputs={filtersValues}
              filterDrillDownValue={drillDownValue}
              fixedFilters={[...fixedFilters, ...selectedPanelFilter]}
              searchBarProps={{ ...searchBarProps, showDatePicker: true }}
              setFilters={setFilters}
              indexPattern={dataSource?.indexPattern}
            />
          </div>
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
            categoriesSampleData={sampleDataWarningCategories}
          />
        </>
      );
    },
  );
