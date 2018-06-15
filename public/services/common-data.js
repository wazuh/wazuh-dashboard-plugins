/*
 * Wazuh app - Common data service
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import * as modules from 'ui/modules'

const app = modules.get('app/wazuh', []);

app.service('commonData', function ($rootScope, $timeout, genericReq, appState, errorHandler, $location, shareAgent) {

    const af = (filterHandler, tab, localChange, agent) => {
        try{
            const tabFilters = {
                general   : { group: '' },
                fim       : { group: 'syscheck' },
                pm        : { group: 'rootcheck' },
                vuls      : { group: 'vulnerability-detector' },
                oscap     : { group: 'oscap' },
                audit     : { group: 'audit' },
                pci       : { group: 'pci_dss' },
                gdpr      : { group: 'gdpr' },
                aws       : { group: 'amazon' },
                virustotal: { group: 'virustotal' }
            };

            const filters = [];
            const isCluster = appState.getClusterInfo().status == 'enabled';
            filters.push(filterHandler.managerQuery(
                isCluster ?
                appState.getClusterInfo().cluster :
                appState.getClusterInfo().manager,
                isCluster
            ))

            if(tab !== 'general'){
                if(tab === 'pci') {
                    filters.push(filterHandler.pciQuery())
                } else if(tab === 'gdpr') {
                    filters.push(filterHandler.gdprQuery())
                } else {
                    filters.push(filterHandler.ruleGroupQuery(tabFilters[tab].group));
                }
            }
            if(agent) filters.push(filterHandler.agentQuery(agent));
            $rootScope.$emit('wzEventFilters',{filters, localChange});
            if(!$rootScope.$$listenerCount['wzEventFilters']){
                $timeout(100)
                .then(() => af(filterHandler, tab, localChange, agent = false))
            }
        } catch(error) {
            errorHandler.handle('An error occurred while creating custom filters for visualizations',agent ? 'Agents' : 'Overview',true);
        }
    };
    return {
        getGDPR: async () => {
            try {
                const gdprTabs = [];
                const data = await genericReq.request('GET', '/api/wazuh-api/gdpr/all')
                if(!data.data) return [];
                for(const key in data.data){
                    gdprTabs.push({ title: key, content: data.data[key] });
                } 
                return gdprTabs;
            } catch(error) {
                return Promise.reject(error);
            }
        },
        getPCI: async () => {
            try {
                const pciTabs = [];
                const data = await genericReq.request('GET', '/api/wazuh-api/pci/all')
                if(!data.data) return [];
                for(const key in data.data){
                    pciTabs.push({ title: key, content: data.data[key] });
                }
                return pciTabs;
            } catch(error) {
                return Promise.reject(error);
            }
        },
        assignFilters: (filterHandler, tab, localChange, agent) => af(filterHandler, tab, localChange, agent),
        validateRange: data => {
            const result = {
                duration  : 'Unknown',
                inProgress: false,
                end       : data.end || 'Unknown',
                start     : data.start || 'Unknown'
            }

            if(data.end && data.start) {
                result.duration = ((new Date(data.end) - new Date(data.start))/1000)/60;
                result.duration = Math.round(result.duration * 100) / 100;
                if(result.duration <= 0){
                    result.inProgress = true;
                }
            } 

            return result;
        },
        checkTabLocation: () => {
            if ($location.search().tab){
                return $location.search().tab;
            } else {
                $location.search('tab', 'welcome');
                return 'welcome';
            }
        },
        checkTabViewLocation: () => {
            if ($location.search().tabView){
                return $location.search().tabView;
            } else {
                $location.search('tabView', 'panels');
                return 'panels'
            }

        },
        checkLocationAgentId: (newAgentId, globalAgent) => {
            if (newAgentId) {
                $location.search('agent', newAgentId);
                return newAgentId;
            } else {
                if ($location.search().agent && !globalAgent) { // There's one in the url
                    return $location.search().agent;
                } else {
                    shareAgent.deleteAgent();
                    $location.search('agent', globalAgent.id);
                    return globalAgent.id;
                }
            }
        }
    }
});