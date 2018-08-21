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
            
            // Once Wazuh core fixes agent 000 issues, this should be adjusted
            const active = data[0].data.data.Active - 1;
            const total  = data[0].data.data.Total - 1;
            this.$scope.agentsCountActive         = active;
            this.$scope.agentsCountDisconnected   = data[0].data.data.Disconnected;
            this.$scope.agentsCountNeverConnected = data[0].data.data['Never connected'];
            this.$scope.agentsCountTotal          = total;
            this.$scope.agentsCoverity            = (active / total) * 100;
    
            this.$scope.daemons       = data[1].data.data;
            this.$scope.managerInfo   = data[2].data.data;
            this.$scope.totalRules    = data[3].data.data.totalItems;
            this.$scope.totalDecoders = data[4].data.data.totalItems;
        
            const lastAgent = await this.apiReq.request('GET', '/agents', { limit: 1, sort: '-dateAdd' });
            const agentInfo = await this.apiReq.request('GET', `/agents/${lastAgent.data.data.items[0].id}`, {});

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
