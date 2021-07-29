import React, { useState, useEffect, useLayoutEffect } from 'react';

import { getIndexPattern } from '../../overview/mitre/lib'
import { Filter } from '../../../../../../src/plugins/data/public/';
import { FilterMeta, FilterState, FilterStateStore } from '../../../../../../src/plugins/data/common';

import {
    EuiFlexGroup,
    EuiFlexItem,
    EuiSwitch,
} from '@elastic/eui';

//@ts-ignore
import { getDataPlugin } from '../../../kibana-services';
import { KbnSearchBar } from '../../kbn-search-bar';
import { TimeRange, Query } from '../../../../../../src/plugins/data/common';
import { Combobox } from './components'

export const CustomSearchBar = ({ filtersValues, ...props }) => {

    const KibanaServices = getDataPlugin().query;
    const filterManager = KibanaServices.filterManager;
    const timefilter = KibanaServices.timefilter.timefilter;
    const indexPattern = getIndexPattern();
    const [filterParams, setFilterParams] = useState({
        filters: filterManager.getFilters().map(({ meta: { removable, ...restMeta }, ...rest }) => ({ ...rest, meta: restMeta })) || [],
        query: { language: 'kuery', query: '' },
        time: timefilter.getTime(),
    });
    const defaultSelectedOptions = () => {
        const array = []
        filtersValues.forEach(item => {
            array[item.key] = []
        })

        return array
    }
    const [isLoading, setLoading] = useState(false);
    const [avancedFiltersState, setAvancedFiltersState] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState(defaultSelectedOptions);

    useEffect(() => {
        let filterSubscriber = filterManager.getUpdates$().subscribe(() => {
            const newFilters = filterManager.getFilters();
            onFiltersUpdated(newFilters)
            return () => {
                filterSubscriber.unsubscribe();
            };
        });
    }, []);

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


    const buildCustomFilter = (isPinned: boolean, index?: any, querySearch?: any, key?: any): Filter => {
        const meta: FilterMeta = {
            disabled: false,
            negate: false,
            key: key,
            params: { query: querySearch },
            alias: null,
            type: "phrase",
            index,
        };
        const $state: FilterState = {
            store: isPinned ? FilterStateStore.GLOBAL_STATE : FilterStateStore.APP_STATE,
        };
        const query = {
            match_phrase: {
                [key]: {
                    query: querySearch
                }
            }
        }

        return { meta, $state, query };
    };

    const setKibanaFilters = (values: any[]) => {
        setLoading(true)
        const newFilters = []
        const currentFilters = filterManager.getFilters().filter(item => item.meta.key != values[0].value)
        filterManager.removeAll()
        filterManager.addFilters(currentFilters)
        values.forEach(element => {
            const customFilter = buildCustomFilter(false, indexPattern.title, element.label, element.value)
            newFilters.push(customFilter);
        });
        filterManager.addFilters(newFilters)
    }

    const refreshCustomSelectedFilter = () => {
        setSelectedOptions(defaultSelectedOptions)
        const filters = filterManager.getFilters()
        const filterCustom = filters.map(item => {
            return {
                value: item.meta.key,
                label: item.meta.params.query,
            }
        }).filter(element => Object.keys(selectedOptions).includes(element.value))

        if (filterCustom.length != 0) {
            filterCustom.forEach(item => {
                setSelectedOptions(prevState => ({
                    ...prevState,
                    [item.value]: [...prevState[item.value], item],
                }));

            })
        }
        setLoading(false)
    };

    const onChange = (values: any[]) => {
        setKibanaFilters(values)
        refreshCustomSelectedFilter();
    };

    const getComponent = (item: any) => {
        var types = {
            'default': <></>,
            'combobox': <Combobox
                item={item}
                selectedOptions={selectedOptions[item.key] || []}
                onChange={onChange}
            />
        };
        return types[item.type] || types['default'];
    }

    return (
        <>
            <EuiFlexGroup className='custom-kbn-search-bar' alignItems='center' style={{ margin: '0 8px' }}>
                {
                    avancedFiltersState === false ?
                        filtersValues.map((item, key) => (
                            <EuiFlexItem key={key}>
                                {getComponent(item)}
                            </EuiFlexItem>
                        ))
                        :
                        ''
                }
                <EuiFlexItem>
                    <KbnSearchBar
                        showFilterBar={false}
                        showQueryInput={avancedFiltersState}
                        onQuerySubmit={onQuerySubmit}
                        onFiltersUpdated={onFiltersUpdated}
                        isLoading={isLoading}
                    />
                </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup justifyContent='flexEnd' style={{ margin: '0 20px' }}>
                <EuiFlexItem className={'filters-search-bar'} style={{ margin: '0px' }}>
                    <KbnSearchBar
                        showDatePicker={false}
                        showQueryInput={false}
                        onQuerySubmit={onQuerySubmit}
                        onFiltersUpdated={onFiltersUpdated}
                        isLoading={isLoading}
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
    )
};