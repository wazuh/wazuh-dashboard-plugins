import React, { useState, useEffect, useLayoutEffect } from 'react';

import { getIndexPattern } from '../../overview/mitre/lib'
import { Filter } from '../../../../../../src/plugins/data/public/';
import { FilterMeta, FilterState, FilterStateStore } from '../../../../../../src/plugins/data/common';

import {
    EuiFlexGroup,
    EuiFlexItem,
    EuiComboBox,
    EuiSwitch,
  } from '@elastic/eui';

//@ts-ignore
import { getDataPlugin } from '../../../kibana-services';
import { KbnSearchBar } from '../../kbn-search-bar';
import { TimeRange, Query } from '../../../../../../src/plugins/data/common';
import { ModulesHelper } from '../modules/modules-helper';

export const CustomSearchBar = ({ ...props }) => {

    const KibanaServices = getDataPlugin().query;
    const filterManager = KibanaServices.filterManager;
    const timefilter = KibanaServices.timefilter.timefilter;
    const indexPattern =  getIndexPattern();
    const [filterParams, setFilterParams] = useState({
        filters: filterManager.getFilters().map(({meta: {removable, ...restMeta}, ...rest}) => ({...rest,meta: restMeta})) || [],
        query: { language: 'kuery', query: '' },
        time: timefilter.getTime(),
    });
    const defaultSelectedOptions = () => {
        const array = []
        props.filtersValues.forEach(item =>{
            array[item.key] = []
        })

        return array
    }
    const [isLoading, setLoading] = useState(false);
    const [customFilters, setCustomFilters] = useState(props.filtersValues)
    const [currentSelectName, setCurrentSelectName] = useState('');
    const [avancedFiltersState, setAvancedFiltersState] = useState(true);
    const [selectedOptions, setSelectedOptions] = useState([]);

    const onQuerySubmit = (payload: { dateRange: TimeRange, query: Query }) => {
        const { query, dateRange } = payload;
        const filters = { query, time: dateRange, filters: filterParams.filters };
        setFilterParams(filters);

    }

    const onFiltersUpdated = (filters: Filter[]) => {
        const { query, time } = filterParams;
        const updatedFilterParams = { query, time, filters };
        setFilterParams(updatedFilterParams);
        refreshCustomSelectedFilter()
    }

    const changeSwitch = () => {
        setAvancedFiltersState(state => !state);
    }

    useEffect(() => {
        if(avancedFiltersState){
            setTimeout(() => ModulesHelper.hideCloseButtons(), 10);
        };
    }, [avancedFiltersState]);

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

    const setKibanaFilters = (values) => {
        setLoading(true)
        const newFilters = []
        if(!values.length){          
                const currentFilters = filterManager.getFilters().filter(item => item.meta.key != currentSelectName)
                filterManager.removeAll()
                filterManager.addFilters(currentFilters)
                
        }else{
            const currentFilters = filterManager.getFilters().filter(item => item.meta.key != values[0].key)
            filterManager.removeAll()
            filterManager.addFilters(currentFilters)
            values.forEach(element => {
                const customFilter = buildCustomFilter(false,indexPattern.title,element.label,element.key)
                newFilters.push(customFilter);
            });
            filterManager.addFilters(newFilters)
        } 
    }

    const refreshCustomSelectedFilter = () => {
        setSelectedOptions(defaultSelectedOptions)
        const filters = filterManager.getFilters()
        const filterCustom = filters.map(item => {
                return  {
                    key: item.meta.key,
                    label: item.meta.params.query,
                }
        }).filter(element => Object.keys(selectedOptions).includes(element.key))

        if(filterCustom.length != 0){
            filterCustom.forEach(item => {
                setSelectedOptions(prevState => ({
                        ...prevState,
                        [item.key]: [...prevState[item.key],item],
                }));
    
            })
        } 
        setLoading(false)      
    };

    const onChange = (values) => {
        setKibanaFilters(values)
        refreshCustomSelectedFilter(); 
    };

    const getComponent = (item) => {
        var types = {
            'default': <></>,
            'combobox': <EuiComboBox
                        placeholder={"Select "+item.key}
                        options={item.values}
                        selectedOptions={selectedOptions[item.key] || []}
                        onChange={onChange}
                        onClick={() => setCurrentSelectName(item.key)}
                        isClearable={false}
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
                isLoading={isLoading} 
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