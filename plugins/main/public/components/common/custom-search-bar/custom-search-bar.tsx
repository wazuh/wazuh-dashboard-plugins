import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  Filter,
  IndexPattern,
} from '../../../../../../src/plugins/data/public/';
import {
  FilterMeta,
  FilterState,
  FilterStateStore,
} from '../../../../../../src/plugins/data/common';
import { EuiFlexGroup, EuiFlexItem, EuiSwitch } from '@elastic/eui';
import { tFilter } from '../data-source';
//@ts-ignore
import { MultiSelect } from './components';
import { getCustomValueSuggestion } from '../../../components/overview/office-panel/config/helpers/helper-value-suggestion';
import { I18nProvider } from '@osd/i18n/react';
import { getPlugins } from '../../../kibana-services';
import { tUseSearchBarProps } from '../search-bar/use-search-bar';

type CustomSearchBarProps = {
  filterInputs: {
    type: string;
    key: string;
    placeholder: string;
  }[];
  filterDrillDownValue: { field: string; value: string };
  searchBarProps: tUseSearchBarProps;
  indexPattern: IndexPattern;
  setFilters: (filters: tFilter[]) => void;
};

const SearchBar = getPlugins().data.ui.SearchBar;

export const CustomSearchBar = ({
  filterInputs,
  filterDrillDownValue = { field: '', value: '' },
  searchBarProps,
  indexPattern,
  setFilters
}: CustomSearchBarProps) => {
  const { filters } = searchBarProps;
  const defaultSelectedOptions = () => {
    const array = [];
    filterInputs.forEach(item => {
      array[item.key] = [];
    });

    return array;
  };
  const [avancedFiltersState, setAvancedFiltersState] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(
    defaultSelectedOptions,
  );
  const [values, setValues] = useState(Array);
  const [selectReference, setSelectReference] = useState('');

  useEffect(() => {
    setPluginPlatformFilters(values, selectReference);
    refreshCustomSelectedFilter();
  }, [values]);

  useEffect(() => {
    onFiltersUpdated();
  }, [filters]);

  const checkSelectDrillDownValue = key => {
    return filterDrillDownValue.field === key &&
      filterDrillDownValue.value != ''
      ? true
      : false;
  };
  const onFiltersUpdated = () => {
    refreshCustomSelectedFilter();
  };

  const changeSwitch = () => {
    setAvancedFiltersState(state => !state);
  };

  const buildCustomFilter = (values?: any): Filter => {
    const newFilters = values.map(element => ({
      match_phrase: {
        [element.value]: {
          query: element.filterByKey ? element.key : element.label,
        },
      },
    }));
    const params = values.map(item =>
      item.filterByKey ? item.key.toString() : item.label,
    );
    const meta: FilterMeta = {
      disabled: false,
      negate: false,
      key: values[0].value,
      params: params,
      alias: null,
      type: 'phrases',
      value: params.join(','),
      index: indexPattern.id,
    };
    const $state: FilterState = {
      store: FilterStateStore.APP_STATE,
    };
    const query = {
      bool: {
        minimum_should_match: 1,
        should: newFilters,
      },
    };

    return { meta, $state, query };
  };

  const setPluginPlatformFilters = (values: any[], selectReference: String) => {
    let customFilter = [];
    const currentFilters = filters.filter(
      item => item.meta.key != selectReference,
    );
    if (values.length != 0) {
      customFilter = [buildCustomFilter(values)];
    }
    setFilters([...currentFilters, ...customFilter]);
  };

  const refreshCustomSelectedFilter = () => {
    setSelectedOptions(defaultSelectedOptions());
    const currentFilters =
      filters
        .filter(
          item =>
            item.meta.type === 'phrases' &&
            Object.keys(selectedOptions).includes(item.meta.key),
        )
        .map(element => ({
          params: element.meta.params,
          key: element.meta.key,
        })) || [];

    const getFilterCustom = item => {
      // ToDo: Make this generic, without office 365 hardcode
      return item.params.map((element) => ({ checked: 'on', label: item.key === 'data.office365.UserType' ? getLabelUserType(element) : element, value: item.key, key: element, filterByKey: item.key === 'data.office365.UserType' ? true : false }));
    };
    const getLabelUserType = element => {
      const userTypeOptions = getCustomValueSuggestion(
        'data.office365.UserType',
      );
      return userTypeOptions.find(
        (item, index) => index.toString() === element,
      );
    };
    const filterCustom = currentFilters.map(item => getFilterCustom(item)) || [];
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

  const onChange = (values: any[], id: string) => {
    setSelectReference(id);
    setValues(values);
  };

  const onRemove = filter => {
    const currentFilters = filters.filter(item => item.meta.key != filter);
    setFilters(currentFilters);
    refreshCustomSelectedFilter();
  };

  const getComponent = (item: any) => {
    const types: { [key: string]: object } = {
      default: <></>,
      multiSelect: (
        <MultiSelect
          item={item}
          selectedOptions={selectedOptions[item.key] || []}
          onChange={onChange}
          onRemove={onRemove}
          isDisabled={checkSelectDrillDownValue(item.key)}
          filterDrillDownValue={filterDrillDownValue}
        />
      ),
    };
    return types[item.type] || types.default;
  };

  return (
    <I18nProvider>
      <EuiFlexGroup
        className='custom-kbn-search-bar'
        alignItems='center'
        style={{ margin: '0 8px' }}
      >
        {!avancedFiltersState
          ? filterInputs.map((item, key) => (
            <EuiFlexItem key={key}>{getComponent(item)}</EuiFlexItem>
          ))
          : ''}
        <EuiFlexItem>
          <div className='wz-search-bar hide-filter-control'>
            <SearchBar
              {...searchBarProps}
              showFilterBar={false}
              showQueryInput={avancedFiltersState}
              onFiltersUpdated={onFiltersUpdated}
            />
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup justifyContent='flexEnd' style={{ margin: '0 20px' }}>
        <EuiFlexItem className={'filters-search-bar'} style={{ margin: '0px' }}>
          <div className='wz-search-bar hide-filter-control'>
            <SearchBar
              {...searchBarProps}
              showDatePicker={false}
              showQueryInput={false}
              onFiltersUpdated={onFiltersUpdated}
            />
          </div>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSwitch
            label='Advanced filters'
            checked={avancedFiltersState}
            onChange={() => changeSwitch()}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </I18nProvider>
  );
};
