/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { Tactics, Techniques } from './components';
import { EuiPanel, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { IFilterParams, getIndexPattern } from './lib';

import {
    FilterManager,
    Filter,
} from '../../../../../../../src/plugins/data/public/';
//@ts-ignore
import { KbnSearchBar } from '../../../kbn-search-bar';
import { TimeRange, Query, IndexPattern } from '../../../../../../../src/plugins/data/common';
import { ModulesHelper } from '../../../common/modules/modules-helper';
import { getDataPlugin, getPlugins, getToasts } from '../../../../kibana-services';
import { withErrorBoundary } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { useDataSource, MitreAttackDataSource, AlertsDataSourceRepository, tParsedIndexPattern, PatternDataSource } from '../../../common/data-source';
export interface ITactic {
    [key: string]: string[];
}

const SearchBar = getPlugins().data.ui.SearchBar;

type tTimefilter = {
    getTime(): TimeRange;
    setTime(time: TimeRange): void;
    _history: { history: { items: { from: string; to: string }[] } };
};

type tPluginPlatformServices = { [key: string]: any };
type tMitreState = {
    tacticsObject: ITactic;
    selectedTactics: Object;
    filterParams: IFilterParams;
};

const MitreComponent = (props) => {
    const { onSelectedTabChanged } = props;
    let PluginPlatformServices: tPluginPlatformServices = getDataPlugin().query;
    let filterManager: FilterManager = PluginPlatformServices.filterManager;
    let timefilter: tTimefilter = PluginPlatformServices.timefilter.timefilter;
    const [isLoading, setIsLoading] = useState(true);
    const [mitreState, setMitreState] = useState<tMitreState>({
        tacticsObject: {},
        selectedTactics: {},
        filterParams: {
            filters: filterManager.getFilters() || [],
            query: { language: 'kuery', query: '' },
            time: timefilter.getTime(),
        }
    })
    const [filtersSubscriber, setFiltersSubscriber] = useState<any>(); //Todo: Add correct ype
    const [indexPattern, setIndexPattern] = useState<any>(); //Todo: Add correct type

    const {
        filters,
        dataSource,
        fetchFilters,
        isLoading: isDataSourceLoading,
        fetchData,
        setFilters
    } = useDataSource<tParsedIndexPattern, PatternDataSource>({
        DataSource: MitreAttackDataSource,
        repository: new AlertsDataSourceRepository(),
    });

    const { searchBarProps } = useSearchBar({
        indexPattern: dataSource?.indexPattern as IndexPattern,
        filters,
        setFilters,
    });

    const initialize = async () => {
        setIndexPattern(await getIndexPattern());
        const scope = await ModulesHelper.getDiscoverScope(); // remove this
        const query = scope.state.query;
        const { filters, time } = mitreState.filterParams;
        const filterParams = { query, time, filters };
        setMitreState({ ...mitreState, filterParams });
        setFiltersSubscriber(filterManager
            .getUpdates$()
            .subscribe(() => {
                onFiltersUpdated(filterManager.getFilters());
            })
        );

        await buildTacticsObject();
    }

    useEffect(() => {
        initialize();

        return () => {
            filtersSubscriber && filtersSubscriber.unsubscribe();
        }
    }, []);



    const onQuerySubmit = (payload: { dateRange: TimeRange; query: Query }) => {
        const { query, dateRange } = payload;
        const { filters } = mitreState.filterParams;
        const filterParams = { query, time: dateRange, filters };
        setMitreState({ ...mitreState, filterParams });
        setIsLoading(true);
    };

    const onFiltersUpdated = (filters: Filter[]) => {
        const { query, time } = mitreState.filterParams;
        const filterParams = { query, time, filters };
        setMitreState({ ...mitreState, filterParams });
        setIsLoading(true);
    };

    const buildTacticsObject = async () => {
        try {
            const data = await WzRequest.apiReq('GET', '/mitre/tactics', {});
            const result = (((data || {}).data || {}).data || {}).affected_items;
            const tacticsObject = {};
            result &&
                result.forEach(item => {
                    tacticsObject[item.name] = item;
                });
            setMitreState({ ...mitreState, tacticsObject });
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            const options = {
                context: `${Mitre.name}.buildTacticsObject`,
                level: UI_LOGGER_LEVELS.ERROR,
                severity: UI_ERROR_SEVERITIES.BUSINESS,
                store: true,
                display: true,
                error: {
                    error: error,
                    message: error.message || error,
                    title: `Mitre data could not be fetched`,
                },
            };
            getErrorOrchestrator().handleError(options);
        }
    }

    const onChangeSelectedTactics = selectedTactics => {
        setMitreState({ ...mitreState, selectedTactics });
    };

    return (
        <div>
            <I18nProvider>
                <EuiFlexGroup>
                    <EuiFlexItem>
                        {isDataSourceLoading && !dataSource ?
                            <LoadingSpinner /> :
                            <div className="wz-discover hide-filter-control wz-search-bar">
                                <SearchBar
                                    appName='vulnerability-detector-searchbar'
                                    {...searchBarProps}
                                    showDatePicker={false}
                                    showQueryInput={true}
                                    showQueryBar={true}
                                    showSaveQuery={true}
                                    onQuerySubmit={onQuerySubmit}
                                    onFiltersUpdated={onFiltersUpdated}
                                />
                            </div>
                        }
                    </EuiFlexItem>
                </EuiFlexGroup>

                <EuiFlexGroup style={{ margin: '0 8px' }}>
                    <EuiFlexItem>
                        <EuiPanel paddingSize='none'>
                            <EuiFlexGroup>
                                <EuiFlexItem
                                    grow={false}
                                    style={{
                                        width: '15%',
                                        minWidth: 145,
                                        height: 'calc(100vh - 325px)',
                                        overflowX: 'hidden',
                                    }}
                                >
                                    <Tactics
                                        indexPattern={indexPattern}
                                        onChangeSelectedTactics={onChangeSelectedTactics}
                                        filters={mitreState.filterParams}
                                        {...mitreState}
                                    />
                                </EuiFlexItem>
                                <EuiFlexItem>
                                    <Techniques
                                        indexPattern={indexPattern}
                                        filters={mitreState.filterParams}
                                        onSelectedTabChanged={id =>
                                            onSelectedTabChanged(id)
                                        }
                                        {...mitreState}
                                    />
                                </EuiFlexItem>
                            </EuiFlexGroup>
                        </EuiPanel>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </I18nProvider>
        </div>
    );

}


export const Mitre = withErrorBoundary(MitreComponent);