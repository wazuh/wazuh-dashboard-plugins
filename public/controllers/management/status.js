/*
 * Wazuh app - Management status controller
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

const app = uiModules.get('app/wazuh', []);

class StatusController {
    constructor($scope, errorHandler, apiReq){
        this.$scope       = $scope;
        this.errorHandler = errorHandler;
        this.apiReq       = apiReq;
        this.$scope.load  = true;

        this.$scope.getDaemonStatusClass = daemonStatus => this.getDaemonStatusClass(daemonStatus);
    }

    /**
     * Initialize
     */
    $onInit() {
        return this.init();
    }

    /**
     * Used to show green/red depending on daemon status
     * @param {*} daemonStatus 
     */
    getDaemonStatusClass(daemonStatus) {
        return (daemonStatus === 'running') ? 'status teal' : 'status red';
    }

    /**
     * Fetchs all required data
     */
    async init() {
        try {
            const data = await Promise.all([
                this.apiReq.request('GET', '/agents/summary', {}),
                this.apiReq.request('GET', '/manager/status', {}),
                this.apiReq.request('GET', '/manager/info', {}),
                this.apiReq.request('GET', '/rules', { offset: 0, limit: 1 }),
                this.apiReq.request('GET', '/decoders', { offset: 0, limit: 1 })
            ])

            const parsedData = data.map(item => item.data.data);
            const [stats, daemons, managerInfo, totalRules, totalDecoders] = parsedData;
            
            // Once Wazuh core fixes agent 000 issues, this should be adjusted
            const active = stats.Active - 1;
            const total  = stats.Total - 1;
            this.$scope.agentsCountActive         = active;
            this.$scope.agentsCountDisconnected   = stats.Disconnected;
            this.$scope.agentsCountNeverConnected = stats['Never connected'];
            this.$scope.agentsCountTotal          = total;

            this.$scope.agentsCoverity            = total ? (active / total) * 100 : 0;
    
            this.$scope.daemons       = daemons;
            this.$scope.managerInfo   = managerInfo;
            this.$scope.totalRules    = totalRules.totalItems;
            this.$scope.totalDecoders = totalDecoders.totalItems;
        
            const lastAgentRaw = await this.apiReq.request('GET', '/agents', { limit: 1, sort: '-dateAdd' });
            const [lastAgent]  = lastAgentRaw.data.data.items;
            const agentInfo    = await this.apiReq.request('GET', `/agents/${lastAgent.id}`, {});

            this.$scope.agentInfo = agentInfo.data.data;
            this.$scope.load      = false;

            if(!this.$scope.$$phase) this.$scope.$digest();

            return;

        } catch (error) {
            return this.errorHandler.handle(error,'Manager');
        }
    }
}

app.controller('managerStatusController', StatusController);
