import React, { useState, useEffect, useLayoutEffect } from 'react';

import { getIndexPattern } from '../../overview/mitre/lib';
import { Filter } from '../../../../../../src/plugins/data/public/';
import {
  FilterMeta,
  FilterState,
  FilterStateStore,
} from '../../../../../../src/plugins/data/common';

import { EuiFlexGroup, EuiFlexItem, EuiSwitch } from '@elastic/eui';

//@ts-ignore
import { getDataPlugin } from '../../../kibana-services';
import { KbnSearchBar } from '../../kbn-search-bar';
import { Combobox } from './components';
import { useFilterManager } from '../hooks';

export const CustomSearchBar = ({ filtersValues, ...props }) => {
  const { filterManager } = useFilterManager();
  const indexPattern = getIndexPattern();
  const defaultSelectedOptions = () => {
    const array = [];
    filtersValues.forEach((item) => {
      array[item.key] = [];
    });

    return array;
  };
  const [avancedFiltersState, setAvancedFiltersState] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(defaultSelectedOptions);

  const onFiltersUpdated = () => {
    refreshCustomSelectedFilter();
  };

  const changeSwitch = () => {
    setAvancedFiltersState((state) => !state);
  };

  const buildCustomFilter = (
    isPinned: boolean,
    index?: any,
    querySearch?: any,
    key?: any
  ): Filter => {
    const meta: FilterMeta = {
      disabled: false,
      negate: false,
      key: key,
      params: { query: querySearch },
      alias: null,
      type: 'phrase',
      index,
    };
    const $state: FilterState = {
      store: isPinned ? FilterStateStore.GLOBAL_STATE : FilterStateStore.APP_STATE,
    };
    const query = {
      match: {
        [key]: {
          query: querySearch,
          type: 'phrase',
        },
      },
    };

    return { meta, $state, query };
  };

  const setKibanaFilters = (values: any[]) => {
    const newFilters = [];
    const currentFilters = filterManager
      .getFilters()
      .filter((item) => item.meta.key != values[0].value);
    filterManager.removeAll();
    filterManager.addFilters(currentFilters);
    values.forEach((element) => {
      const customFilter = buildCustomFilter(
        false,
        indexPattern.title,
        element.label,
        element.value
      );
      newFilters.push(customFilter);
    });
    filterManager.addFilters(newFilters);
  };

  const refreshCustomSelectedFilter = () => {
    setSelectedOptions(defaultSelectedOptions);
    const filters = filterManager.getFilters();
    const filterCustom = filters
      .map((item) => {
        return {
          value: item.meta.key,
          label: item.meta.params.query,
        };
      })
      .filter((element) => Object.keys(selectedOptions).includes(element.value));

    if (filterCustom.length != 0) {
      filterCustom.forEach((item) => {
        setSelectedOptions((prevState) => ({
          ...prevState,
          [item.value]: [...prevState[item.value], item],
        }));
      });
    }
  };

  const onChange = (values: any[]) => {
    setKibanaFilters(values);
    refreshCustomSelectedFilter();
  };

  const getComponent = (item: any) => {
    var types = {
      default: <></>,
      combobox: (
        <Combobox
          item={item}
          selectedOptions={selectedOptions[item.key] || []}
          onChange={onChange}
        />
      ),
    };
    return types[item.type] || types['default'];
  };

  return (
    <>
      <EuiFlexGroup
        className="custom-kbn-search-bar"
        alignItems="center"
        style={{ margin: '0 8px' }}
      >
        {avancedFiltersState === false
          ? filtersValues.map((item, key) => (
              <EuiFlexItem key={key}>{getComponent(item)}</EuiFlexItem>
            ))
          : ''}
        <EuiFlexItem>
          <KbnSearchBar
            showFilterBar={false}
            showQueryInput={avancedFiltersState}
            onFiltersUpdated={onFiltersUpdated}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup justifyContent="flexEnd" style={{ margin: '0 20px' }}>
        <EuiFlexItem className={'filters-search-bar'} style={{ margin: '0px' }}>
          <KbnSearchBar
            showDatePicker={false}
            showQueryInput={false}
            onFiltersUpdated={onFiltersUpdated}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSwitch
            label="Advanced filters"
            checked={avancedFiltersState}
            onChange={() => changeSwitch()}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
