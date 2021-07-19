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


export const MainPanel = ({ sidePanelChildren, moduleConfig = {}, drilldownConfig = {}, ...props }) => {

    const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
    const KibanaServices = getDataPlugin().query;
    const filterManager = KibanaServices.filterManager;
    const timefilter = KibanaServices.timefilter.timefilter;

    const [isLoading, setLoading] = useState(false);
    const [filterParams, setFilterParams] = useState({
        filters: filterManager.getFilters() || [],
        query: { language: 'kuery', query: '' },
        time: timefilter.getTime(),
    });


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

    const toggleDrilldown = () => {
        setIsDrilldownOpen(!isDrilldownOpen);
    }

    const bodyProps = { ...moduleConfig, toggleDrilldown };
    const drilldownProps = { ...drilldownConfig, toggleDrilldown };
    
    return (
        <EuiFlexGroup style={{ margin: '0 8px' }}>
            <EuiFlexItem>
                {sidePanelChildren && <ModuleSidePanel>
                    {sidePanelChildren}
                </ModuleSidePanel >
                }
                <EuiPageBody>
                    <KbnSearchBar
                        onQuerySubmit={onQuerySubmit}
                        onFiltersUpdated={onFiltersUpdated}
                        isLoading={isLoading} />
                    {!isDrilldownOpen && <ModuleBody {...bodyProps} />}
                    {drilldownConfig && isDrilldownOpen && <ModuleDrilldown {...drilldownProps} />}
                </EuiPageBody>
            </EuiFlexItem>
        </EuiFlexGroup>
    );
};

