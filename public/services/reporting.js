/*
 * Wazuh app - Reporting service
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import $             from 'jquery';

uiModules.get('app/wazuh', [])
.service('reportingService', function ($rootScope, vis2png, rawVisualizations, visHandlers, genericReq, errorHandler) {
    return {
        startVis2Png: async (tab, isAgents = false, syscollectorFilters = null) => {
            try {
                if(vis2png.isWorking()){
                    errorHandler.handle('Report in progress', 'Reporting',true);
                    return;
                }
                $rootScope.reportBusy = true;
                $rootScope.reportStatus = 'Generating report...0%';
                if(!$rootScope.$$phase) $rootScope.$digest();

                vis2png.clear();

                const idArray = rawVisualizations.getList().map(item => item.id);

                for(const item of idArray) {
                    const tmpHTMLElement = $(`#${item}`);
                    vis2png.assignHTMLItem(item,tmpHTMLElement);
                }

                const appliedFilters = visHandlers.getAppliedFilters(syscollectorFilters);
                
                const array = await vis2png.checkArray(idArray);
                const name  = `wazuh-${isAgents ? 'agents' : 'overview'}-${tab}-${Date.now() / 1000 | 0}.pdf`

                const data = {
                    array,
                    name,
                    title: isAgents ? `Agents ${tab}` : `Overview ${tab}`,
                    filters: appliedFilters.filters,
                    time: appliedFilters.time,
                    searchBar: appliedFilters.searchBar,
                    tables: appliedFilters.tables,
                    tab,
                    section: isAgents ? 'agents' : 'overview',
                    isAgents
                };

                await genericReq.request('POST','/api/wazuh-reporting/report',data);

                $rootScope.reportBusy = false;
                $rootScope.reportStatus = false;

                errorHandler.info('Success. Go to Management -> Reporting', 'Reporting')

                return;
            } catch (error) {
                $rootScope.reportBusy = false;
                $rootScope.reportStatus = false;
                errorHandler.handle(error, 'Reporting');
            }
        }
    };
});
