import React, { useState, useEffect } from 'react';

import { Filter } from '../../../../../../src/plugins/data/public/';
import {
  FilterMeta,
  FilterState,
  FilterStateStore,
} from '../../../../../../src/plugins/data/common';
import { AppState } from '../../../react-services/app-state';

import { EuiFlexGroup, EuiFlexItem, EuiSwitch } from '@elastic/eui';

//@ts-ignore
import { KbnSearchBar } from '../../kbn-search-bar';
import { Combobox } from './components';
import { useFilterManager } from '../hooks';

export const CustomSearchBar = ({ filtersValues, ...props }) => {
  const { filterManager, filters } = useFilterManager();
  const defaultSelectedOptions = () => {
    const array = [];
    filtersValues.forEach((item) => {
      array[item.key] = [];
    });

    return array;
  };
  const [avancedFiltersState, setAvancedFiltersState] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(defaultSelectedOptions);
  const [values, setValues] = useState([]);
  const [selectReference, setSelectReference] = useState('');

  useEffect(() => {
      setKibanaFilters(values, selectReference);
      refreshCustomSelectedFilter();
  }, [values]);

  useEffect(() => {
    onFiltersUpdated();
  }, [filters]);

  const onFiltersUpdated = () => {
    refreshCustomSelectedFilter();
  };

  const changeSwitch = () => {
    setAvancedFiltersState((state) => !state);
  };

  const buildCustomFilter = (isPinned: boolean, values?: any): Filter => {
    const newFilters = values.map((element) => ({
      match_phrase: {
        [element.value]: {
          query: element.label,
        },
      },
    }));
    const params = values.map((item) => item.label);
    const meta: FilterMeta = {
      disabled: false,
      negate: false,
      key: values[0].value,
      params: params,
      alias: null,
      type: 'phrases',
      value: params.join(','),
      index: AppState.getCurrentPattern(),
    };
    const $state: FilterState = {
      store: isPinned ? FilterStateStore.GLOBAL_STATE : FilterStateStore.APP_STATE,
    };
    const query = {
      bool: {
        minimum_should_match: 1,
        should: newFilters,
      },
    };

    return { meta, $state, query };
  };

  const setKibanaFilters = (values: any[], selectReference: String) => {
    const currentFilters = filterManager
      .getFilters()
      .filter((item) => item.meta.key != selectReference);
    filterManager.removeAll();
    filterManager.addFilters(currentFilters);
    if (values.length != 0) {
      const customFilter = buildCustomFilter(false, values);
      filterManager.addFilters(customFilter);
    }
  };

  const refreshCustomSelectedFilter = () => {
    setSelectedOptions(defaultSelectedOptions);
    const filters =
      filterManager
        .getFilters()
        .filter(
          (item) =>
            item.meta.type === 'phrases' && Object.keys(selectedOptions).includes(item.meta.key)
        )
        .map((element) => ({ params: element.meta.params, key: element.meta.key })) || [];

    const getFilterCustom = (item) => {
      return item.params.map((element) => ({ label: element, value: item.key }));
    };
    const filterCustom = filters.map((item) => getFilterCustom(item)) || [];
    if (filterCustom.length != 0) {
      filterCustom.forEach((item) => {
        item.forEach((element) => {
          setSelectedOptions((prevState) => ({
            ...prevState,
            [element.value]: [...prevState[element.value], element],
          }));
        });
      });
    }
  };

  const onChange = (values: any[]) => {
    setValues(values);
  };

  const getComponent = (item: any) => {
    const types = {
      default: <></>,
      combobox: (
        <Combobox
          id={item.key}
          item={item}
          selectedOptions={selectedOptions[item.key] || []}
          onChange={onChange}
          onClick={() => setSelectReference(item.key)}
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
