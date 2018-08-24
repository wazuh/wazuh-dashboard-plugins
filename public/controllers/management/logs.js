/*
 * Wazuh app - Management logs controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules }  from 'ui/modules'
import * as FileSaver from '../../services/file-saver'

const app = uiModules.get('app/wazuh', []);

class Logs {
    constructor($scope, apiReq, errorHandler, csvReq, appState, wzTableFilter) {
        this.$scope        = $scope;
        this.apiReq        = apiReq;
        this.errorHandler  = errorHandler;
        this.csvReq        = csvReq;
        this.appState      = appState;
        this.wzTableFilter = wzTableFilter;

        this.$scope.type_log = 'all';
        this.$scope.category = 'all';
    }

    /**
     * Initialize
     */
    $onInit() {
        this.initialize();
        this.$scope.search = term => this.search(term);
        this.$scope.filter = filter => this.filter(filter);
        this.$scope.playRealtime = () => this.playRealtime();
        this.$scope.stopRealtime = () => this.stopRealtime();
        this.$scope.downloadCsv  = () => this.downloadCsv();
    }

    /**
     * Event handler for the search bar.
     * @param {string} term Term(s) to be searched
     */
    search(term) {
        this.$scope.$broadcast('wazuhSearch',{term})
    }
   
    /**
     * Event handler for the selectors
     * @param {*} filter Filter to be applied
     */
    filter(filter) {
        this.$scope.$broadcast('wazuhFilter',{filter})
    }

    /**
     * Starts real time mode
     */
    playRealtime() {
        this.$scope.realtime   = true;
        this.$scope.$broadcast('wazuhPlayRealTime')
    }

    /**
     * Stops real time mode
     */
    stopRealtime() {
        this.$scope.realtime   = false;
        this.$scope.$broadcast('wazuhStopRealTime')
    }

    /**
     * Builds a CSV file from the table and starts the download
     */
    async downloadCsv() {
        try {
            this.errorHandler.info('Your download should begin automatically...', 'CSV')
            const currentApi   = JSON.parse(this.appState.getCurrentAPI()).id;
            const output       = await this.csvReq.fetch('/manager/logs', currentApi, this.wzTableFilter.get());
            const blob         = new Blob([output], {type: 'text/csv'}); // eslint-disable-line
            FileSaver.saveAs(blob, 'logs.csv');
            return;
        } catch (error) {
            this.errorHandler.handle(error,'Download CSV');
        }
        return;
    }

    /**
     * Fetchs required data
     */
    async initialize() {
        try{   
            const data     = await this.apiReq.request('GET', '/manager/logs/summary', {});
            const daemons  = data.data.data;
            this.$scope.daemons = Object.keys(daemons).map(item => { return { title: item } })
            if(!this.$scope.$$phase) this.$scope.$digest();
            return;
        } catch (error) {
            this.errorHandler.handle(error,'Logs');
        }
        return;
    }
}

// Logs controller
app.controller('managerLogController', Logs);
