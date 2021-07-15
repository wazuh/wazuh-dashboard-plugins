/*
 * Wazuh app - Office 365 Panel react component.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState } from 'react';

import { MainPanel } from '../../../components/common/modules/panel';
import { FilterManager, Filter } from '../../../../../../src/plugins/data/public/';
//@ts-ignore
import { getDataPlugin } from '../../../kibana-services';
import { KbnSearchBar } from '../../kbn-search-bar';
import { TimeRange, Query } from '../../../../../../src/plugins/data/common';
import { withErrorBoundary } from '../../common/hocs';
import { MockupTables } from './mockup-tables';
import { ModuleStats } from './module-stats';

export const OfficePanel = withErrorBoundary(({ ...props }) => {

    const KibanaServices = getDataPlugin().query;
    const filterManager = KibanaServices.filterManager;
    const timefilter = KibanaServices.timefilter.timefilter;

    const [moduleStatsList, setModuleStatsList] = useState([]);
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
        <MainPanel sidePanelChildren={<ModuleStats listItems={moduleStatsList} />}>
            <KbnSearchBar
                onQuerySubmit={onQuerySubmit}
                onFiltersUpdated={onFiltersUpdated}
                isLoading={isLoading} />
            <MockupTables />
        </MainPanel>
    )
});
