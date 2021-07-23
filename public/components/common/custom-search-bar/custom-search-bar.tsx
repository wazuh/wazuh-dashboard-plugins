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
        setLoading(true);
        refreshCustomSelectedFilter()
        setFilterParams(updatedFilterParams);
    }

    const getCustomFilters = (filters) => {
        const deleteDefaultFilters = []
        filters.forEach(filter => {
                if(!defaultFilters.some(item => item.meta.key === filter.meta.key)){
                   deleteDefaultFilters.push(filter)
                }
         })

         return deleteDefaultFilters
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

    const setKibanaFilters = async (values) => {
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

    const refreshCustomSelectedFilter = () => {
        const filters = filterManager.getFilters()
        const customFilters = getCustomFilters(filters)
        const filtersUpdated = []
        customFilters.forEach(item => {
            const filterObj = {
                key: item.meta.key,
                label: item.meta.params.query,
            }
            filtersUpdated.push(filterObj)

        })
        setSelectedOptions(filtersUpdated)
        console.log(customFilters)
       
    };

    const onChange = async(values) => {
        await setKibanaFilters(values)
        refreshCustomSelectedFilter();
    };


    const getComponent = (item) => {
        var types = {
            'default': <></>,
            'combobox': <EuiComboBox
                        placeholder={"Select "+item.key}
                        options={item.values}
                        selectedOptions={selectedOptions}
                        onChange={onChange}
                        isClearable={true}
                    />
        };
        return types[item.type] || types['default'];
    }

    return (
        <>
        <EuiFlexGroup alignItems='center' style={{ margin: '0 8px' }}>
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
        <EuiFlexGroup justifyContent='flexEnd' style={{ margin: '0 20px' }}>
            <EuiFlexItem grow={false}>
                <EuiSwitch
                label="Advanced filters"
                checked={avancedFiltersState}
                onChange={() => changeSwitch()}
                />
            </EuiFlexItem>
        </EuiFlexGroup>
    </>
    )
};