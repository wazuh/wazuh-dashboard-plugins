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
import { uiModules } from 'ui/modules'

const app = uiModules.get('app/wazuh', []);

class CommonData {
    constructor($rootScope, $timeout, genericReq, appState, errorHandler, $location, shareAgent, globalState) {
        this.$rootScope   = $rootScope;
        this.$timeout     = $timeout;
        this.genericReq   = genericReq;
        this.appState     = appState;
        this.errorHandler = errorHandler;
        this.$location    = $location;
        this.shareAgent   = shareAgent;
        this.globalState  = globalState;
    }

    removeRuleId() {
        if(!this.globalState || !this.globalState.filters) return;
        const arr = [];
        for(const item of this.globalState.filters){
            if(item.query && item.query.match && item.query.match["rule.id"] && item.query.match["rule.id"].query) {
                continue;
            }
            arr.push(item);
        }
        this.globalState.filters = arr;
    }

    removeDuplicateRuleGroups(group) {
        if(!this.globalState || !this.globalState.filters) return;
        const globalRuleGroupFilters = this.globalState.filters.map(item => {
            if(item.query && item.query.match && item.query.match["rule.groups"] && item.query.match["rule.groups"].query) {
                return item.query.match["rule.groups"].query
            }
            
            return null;            
        })

        if(globalRuleGroupFilters.includes(group)) {
            this.globalState.filters.splice(globalRuleGroupFilters.indexOf(group), 1);
        }
    }

    removeDuplicateExists(condition) {
        if(!this.globalState || !this.globalState.filters) return;
        const globalRuleExistsFilters = this.globalState.filters.map(item => {
            if(item.exists && item.exists.field) {
                return item.exists.field
            }
            
            return null;            
        })

        if(globalRuleExistsFilters.includes(condition)) {
            this.globalState.filters.splice(globalRuleExistsFilters.indexOf(condition), 1);
        }
    }


    af(filterHandler, tab, localChange, agent) {
        try{
            const tabFilters = {
                general   : { group: '' },
                fim       : { group: 'syscheck' },
                pm        : { group: 'rootcheck' },
                vuls      : { group: 'vulnerability-detector' },
                oscap     : { group: 'oscap' },
                ciscat    : { group: 'ciscat' },
                audit     : { group: 'audit' },
                pci       : { group: 'pci_dss' },
                gdpr      : { group: 'gdpr' },
                aws       : { group: 'amazon' },
                virustotal: { group: 'virustotal' }
            };

            const filters = [];
            const isCluster = this.appState.getClusterInfo().status == 'enabled';
            filters.push(filterHandler.managerQuery(
                isCluster ?
                this.appState.getClusterInfo().cluster :
                this.appState.getClusterInfo().manager,
                isCluster
            ))

            if(tab !== 'general'){
                if(tab === 'pci') {
                    this.removeDuplicateExists('rule.pci_dss')
                    filters.push(filterHandler.pciQuery())
                } else if(tab === 'gdpr') {
                    this.removeDuplicateExists('rule.gdpr')
                    filters.push(filterHandler.gdprQuery())
                } else {
                    this.removeDuplicateRuleGroups(tabFilters[tab].group)
                    filters.push(filterHandler.ruleGroupQuery(tabFilters[tab].group));
                }
            }
            if(agent) filters.push(filterHandler.agentQuery(agent));
            this.$rootScope.$emit('wzEventFilters',{filters, localChange});
            if(!this.$rootScope.$$listenerCount['wzEventFilters']){
                this.$timeout(100)
                .then(() => this.af(filterHandler, tab, localChange, agent = false))
            }
        } catch(error) {
            this.errorHandler.handle('An error occurred while creating custom filters for visualizations', agent ? 'Agents' : 'Overview',true);
        }
    }

    async getGDPR() {
        try {
            const gdprTabs = [];
            const data = await this.genericReq.request('GET', '/api/wazuh-api/gdpr/all')
            if(!data.data) return [];
            for(const key in data.data){
                gdprTabs.push({ title: key, content: data.data[key] });
            }
            return gdprTabs;
        } catch(error) {
            return Promise.reject(error);
        }
    }

    async getPCI() {
        try {
            const pciTabs = [];
            const data = await this.genericReq.request('GET', '/api/wazuh-api/pci/all')
            if(!data.data) return [];
            for(const key in data.data){
                pciTabs.push({ title: key, content: data.data[key] });
            }
            return pciTabs;
        } catch(error) {
            return Promise.reject(error);
        }
    }

    assignFilters(filterHandler, tab, localChange, agent) {
        return this.af(filterHandler, tab, localChange, agent);
    } 

    validateRange(data) {
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
    }

    checkTabLocation() {
        if (this.$location.search().tab){
            return this.$location.search().tab;
        } else {
            this.$location.search('tab', 'welcome');
            return 'welcome';
        }
    }

    checkTabViewLocation() {
        if (this.$location.search().tabView){
            return this.$location.search().tabView;
        } else {
            this.$location.search('tabView', 'panels');
            return 'panels'
        }
    }

    checkLocationAgentId(newAgentId, globalAgent) {
        if (newAgentId) {
            this.$location.search('agent', newAgentId);
            return newAgentId;
        } else {
            if (this.$location.search().agent && !globalAgent) { // There's one in the url
                return this.$location.search().agent;
            } else {
                this.shareAgent.deleteAgent();
                this.$location.search('agent', globalAgent.id);
                return globalAgent.id;
            }
        }
    }
}

app.service('commonData', CommonData);