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

import React, { useEffect, useState } from 'react';
import { MainPanel } from '../../../components/common/modules/panel';
import { withErrorBoundary } from '../../common/hocs';
import { ModuleStats } from './module-stats';
import { queryConfig } from '../../../react-services/query-config';
import { DrilldownConfig, MainViewConfig } from './config/';

export const OfficePanel = withErrorBoundary(({ ...props }) => {

    const [moduleStatsList, setModuleStatsList] = useState([]);
    useEffect(() => {
        (async () => {
            try {
                const modulesConfig = await queryConfig(
                    '000',
                    [{ component: 'wmodules', configuration: 'wmodules' }]
                );
                const config = Object.entries(modulesConfig["wmodules-wmodules"].affected_items[0].wmodules
                    .filter((module) => { return Object.keys(module)[0] == 'sca' })[0]['sca']).map((configProp) => {
                        const description = Array.isArray(configProp[1]) ? configProp[1].join(', ') : configProp[1];
                        return { title: configProp[0], description }
                    })
                setModuleStatsList(config);
            } catch (error) {
                setModuleStatsList([{ title: 'Module Unavailable', description: '' }]);
            }
        }
        )();
    }, [])
    return (
        <MainPanel moduleConfig={MainViewConfig} drillDownConfig={DrilldownConfig}
            sidePanelChildren={<ModuleStats listItems={moduleStatsList} />} />
    )
});
