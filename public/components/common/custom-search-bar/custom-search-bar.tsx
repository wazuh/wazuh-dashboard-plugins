import React, { useState, useEffect } from 'react';

import { getIndexPattern } from '../../overview/mitre/lib'
import { Filter } from '../../../../../../src/plugins/data/public/';
import { FilterMeta, FilterState, FilterStateStore } from '../../../../../../src/plugins/data/common';

import {
    EuiFlexGroup,
    EuiFlexItem,
    EuiComboBox,
    EuiSwitch,
    EuiSpacer,
  } from '@elastic/eui';

//@ts-ignore
import { getDataPlugin } from '../../../kibana-services';
import { KbnSearchBar } from '../../kbn-search-bar';
import { TimeRange, Query } from '../../../../../../src/plugins/data/common';



export const CustomSearchBar = ({ ...props }) => {

    const KibanaServices = getDataPlugin().query;
    const filterManager = KibanaServices.filterManager;
    const timefilter = KibanaServices.timefilter.timefilter;
    const [filterParams, setFilterParams] = useState({
        filters: filterManager.getFilters() || [],
        query: { language: 'kuery', query: '' },
        time: timefilter.getTime(),
    });
    const [isLoading, setLoading] = useState(false);
    const [customFilters, setCustomFilters] = useState(props.filtersValues)
    const [avancedFiltersState, setAvancedFiltersState] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [defaultFilters, setDefaultFilters] = useState(filterManager.getFilters());

        

    const onQuerySubmit = (payload: { dateRange: TimeRange, query: Query }) => {
        const { query, dateRange } = payload;
        const filters = { query, time: dateRange, filters: filterParams.filters };
        setLoading(true);
        setFilterParams(filters);

    }

    const onFiltersUpdated = (filters: Filter[]) => {
        const { query, time } = filterParams;
        const updatedFilterParams = { query, time, filters };
        refreshCustomFilters(filters)
        setLoading(true);
        setFilterParams(updatedFilterParams);
    }

    const refreshCustomFilters = (filters) => {
        const deleteDefaultFilters = []
        filters.forEach(filter => {
                if(!defaultFilters.some(item => item.meta.key === filter.meta.key)){
                   deleteDefaultFilters.push(filter)
                }
         })
    }

    const changeSwitch = () => {
        avancedFiltersState ? setAvancedFiltersState(false) : setAvancedFiltersState(true);
    }

    const buildCustomFilter = (isPinned: boolean, index?: any, querySearch?:any, key?:any): Filter => {
        const meta: FilterMeta = {
          disabled: false,
          negate: false,
          key:key,
          params: {query:querySearch},
          alias: null,
          type: "phrase",
          index,
        };
        const $state: FilterState = {
          store: isPinned ? FilterStateStore.GLOBAL_STATE : FilterStateStore.APP_STATE,
        };
        const query = {
            match_phrase: {
                [key] : {
                    query: querySearch
                }
            }
        }
      
        return { meta, $state, query };
    };

    const setFilters = async (values) => {
        const indexPattern =  await getIndexPattern()
        const newFilters = []
        if(!values.length){
            filterManager.removeAll()
            filterManager.addFilters(defaultFilters)
        }else{
            filterManager.removeAll()
            newFilters.push(defaultFilters);
            values.forEach(element => {
                const customFilter = buildCustomFilter(false,indexPattern.title,element.label,element.key)
                newFilters.push(customFilter);
            });
            filterManager.addFilters(newFilters)
        }   
    }

    const onChange = (values) => {
        setFilters(values)
        setSelectedOptions(values);
    };

    const getComponent = (item) => {
        var types = {
            'default': <></>,
            'combobox': <EuiComboBox
                        placeholder={"Select "+item.values[0].key+" or create options"}
                        options={item.values}
                        selectedOptions={selectedOptions || []}
                        onChange={onChange}
                        isClearable={true}
                    />
        };
        return types[item.type] || types['default'];
    }

    return (
        <>
        <EuiFlexGroup alignItems='center'>
            {
                avancedFiltersState === false ?
                customFilters.map((item, key) => (
                    <EuiFlexItem grow={2} key={key}>
                        {getComponent(item)}             
                    </EuiFlexItem>
                ))
                :
                ''
            } 
            <EuiFlexItem>
            <KbnSearchBar
                showFilterBar={avancedFiltersState}
                showQueryInput={avancedFiltersState}
                onQuerySubmit={onQuerySubmit}
                onFiltersUpdated={onFiltersUpdated}
                isLoading={false} 
            />
            </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup justifyContent='flexEnd'>
            <EuiFlexItem grow={false} style={{ paddingTop: '10px' }}>
                <EuiSwitch
                label="Advanced filters"
                checked={avancedFiltersState}
                onChange={() => changeSwitch()}
                />
            </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
    </>
    )
};