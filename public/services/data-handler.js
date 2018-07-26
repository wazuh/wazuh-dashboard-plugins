/*
 * Wazuh app - Data handler service
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

app.factory('DataHandler', function ($q, apiReq,errorHandler) {
    class DataHandler {
        constructor() {
            this.items           = [];
            this.filters         = [];
            this.path            = '';
            this.offset          = 0;
            this.sortValue       = '';
            this.initial         = true;
            this.initialBatch    = 40;
            this.regularBatch    = 15;
            this.busy            = false;
            this.end             = false;
        }

        nextPage () {
            if(this.totalItems && this.items && this.totalItems > this.items.length){
                this.end = false;
            }
            if (this.busy || this.end) {
                return Promise.resolve(true);
            }
            const deferred = $q.defer();

            this.busy = true;
            let requestData;

            if (this.initial) {
                requestData = {
                    offset: this.offset,
                    limit:  this.initialBatch
                };
                this.initial = false;
            } else {
                requestData = {
                    offset: this.offset,
                    limit:  this.regularBatch
                };
            }
            if(this.sortValue){
                requestData.sort = this.sortDir ? '-' + this.sortValue : this.sortValue;
            }

            for(let filter of this.filters){
                if (filter.value !== '') requestData[filter.name] = filter.value;
            }

            if(this.offset !== 0 && this.offset >= this.totalItems){
                this.end = true;
                this.busy = false;
                return Promise.resolve(true);
            }
            
            const path = this.onlyParents ? this.path + '/parents' : this.path;
            apiReq.request('GET', path, requestData)
            .then(data => {
                if (data.data.data === 0){
                    this.busy = false;
                    deferred.resolve(false);
                }
                this.totalItems = data.data.data.totalItems;
                let items       = data.data.data.items;
                for (let i = 0,len = items.length; i < len; i++) {
                    this.items.push(items[i]);
                    this.items[i].selected = false;
                }
                // Prevents from any manager
                if (this.path === '/agents') {
                    const filteredAgents = this.items.filter(item => item && item.id !== '000');
                    this.items = filteredAgents;
                }
                this.offset += items.length;
                if (this.offset >= this.totalItems) this.end = true;
                if (data.data.data !== 0){
                    deferred.resolve(true);
                }
                this.busy = false;
            })
            .catch(error => {
                this.busy = false;
                errorHandler.handle(error,'Datahandler factory');
            });

            return deferred.promise;
        }

        addFilter (filterName, value) {
            this.removeFilter(filterName, false);
            
            this.filters.push({
                name:  filterName,
                value: value
            });
            return this.search();
        }

        removeFilter (filterName, search) {
            this.end = false;
            if(search) this.filters = this.filters.filter(filter => filterName !== filter.name && filter.value !== search);
            else       this.filters = this.filters.filter(filter => filterName !== filter.name);

            if (search) this.search();

        }

        search () {
            if (this.busy) {
                return Promise.resolve(true);
            }
            this.busy      = true;
            const deferred = $q.defer();
            let requestData;
            this.end       = false;

            //this.sortValue = '';
            requestData = {
                offset: 0,
                limit:  this.initialBatch
            };
            if(this.sortValue){
                requestData.sort = this.sortDir ? '-' + this.sortValue : this.sortValue;
            }

            let isUnknown = false;

            for(let filter of this.filters){
                   if (filter.value !== '' && filter.value !== 'Unknown') requestData[filter.name] = filter.value;
                if (filter.value === 'Unknown') isUnknown = true;
            }


            apiReq.request('GET', this.path, requestData)
            .then(data => {
                this.items = [];
                let items  = data.data.data.items;
                this.totalItems = data.data.data.totalItems;
                for (let i = 0,len = items.length; i < len; i++) {
                    this.items.push(items[i]);
                    this.items[i].selected = false;
                }
                if(isUnknown){
                    this.items = this.items.filter(item => typeof item.os === 'undefined');
                }

                // Prevents from any manager
                if (this.path === '/agents') {
                    const filteredAgents = this.items.filter(item => item && item.id !== '000');
                    this.items = filteredAgents;
                }
                this.offset = items.length;
                deferred.resolve(true);
                this.busy = false;
            })
            .catch(error => {
                this.busy = false;
                errorHandler.handle(error,'Datahandler factory');
            });

            return deferred.promise;
        }

        reset() {
            this.items           = [];
            this.filters         = [];
            this.offset          = 0;
            this.sortValue       = '';
            this.initial         = true;
            this.end             = false;
            this.busy            = false;
        }
    }

    return DataHandler;
});
