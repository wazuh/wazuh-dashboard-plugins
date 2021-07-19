import React, { useState } from 'react';
import {
    EuiFlexGroup,
    EuiFlexItem,
    EuiPage,
    EuiPageSideBar,
    EuiPageBody,
} from '@elastic/eui';
import { ModuleSidePanel, ModuleBody, ModuleDrilldown } from './';
import { FilterManager, Filter } from '../../../../../../../src/plugins/data/public/';
//@ts-ignore
import { getDataPlugin } from '../../../../kibana-services';
import { KbnSearchBar } from '../../../kbn-search-bar';
import { TimeRange, Query } from '../../../../../../../src/plugins/data/common';
import { MockupTables } from './mockup-tables';



export const MainPanel = ({ sidePanelChildren, moduleConfig = {}, drilldownConfig = {}, ...props }) => {

    const KibanaServices = getDataPlugin().query;
    const filterManager = KibanaServices.filterManager;
    const timefilter = KibanaServices.timefilter.timefilter;

    const [filterParams, setFilterParams] = useState({
        filters: filterManager.getFilters() || [],
        query: { language: 'kuery', query: '' },
        time: timefilter.getTime(),
    });
    const [isLoading, setLoading] = useState(false);


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
        setFilterParams(updatedFilterParams);
    }

    return (
        <EuiFlexGroup style={{ margin: '0 8px' }}>
            <EuiFlexItem>
                {sidePanelChildren && <ModuleSidePanel>
                    {sidePanelChildren}
                </ModuleSidePanel >
                }
                <EuiPageBody>
                    {<ModuleBody {...moduleConfig}>
                        <KbnSearchBar
                            onQuerySubmit={onQuerySubmit}
                            onFiltersUpdated={onFiltersUpdated}
                            isLoading={isLoading} />

                    </ModuleBody>}
                    {drilldownConfig && <ModuleDrilldown {...drilldownConfig} />}
                </EuiPageBody>
            </EuiFlexItem>
        </EuiFlexGroup>
    );
};

