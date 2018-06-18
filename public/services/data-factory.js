/*
 * Wazuh app - Wazuh data factory
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export default class DataFactory {
    constructor(httpClient, path){
        this.httpClient = httpClient;
        this.items   = [];
        this.path    = path;
        this.filters = [];
        this.sortValue = false;   
        this.sortDir   = false;     
        this.sortValue = false;
    }

    addSorting(value) {
        this.sortValue = value;
        this.sortDir   = !this.sortDir;
    }

    removeFilters(){
        this.filters = [];
    }

    serializeFilters(parameters) {
        if(this.sortValue){
            parameters.sort = this.sortDir ? '-' + this.sortValue : this.sortValue;
        }

        for(const filter of this.filters){
            if (filter.value !== '') parameters[filter.name] = filter.value;
        }
    }

    addFilter (filterName, value) {
        this.filters = this.filters.filter(filter => filter.name !== filterName);

        if(typeof value !== 'undefined'){
            this.filters.push({
                name:  filterName,
                value: value
            });
        }
    }
    
    async fetch(options = {}) {
        try {     
            this.items       = [];       
            let offset       = 0;
            const limit      = options.limit || 2000;
            const parameters = { limit,offset };
            
            this.serializeFilters(parameters);
            

            const firstPage = await this.httpClient.request('GET', this.path, parameters)

            this.items.push(...firstPage.data.data.items)
            if(options.limit) {
                if(this.path === '/agents') this.items = this.items.filter(item => item.id !== '000')
                return this.items;   
            }

            const totalItems = firstPage.data.data.totalItems;
            const remaining  = totalItems-firstPage.data.data.items.length;

            const float_ops_number = remaining / limit;
            const int_ops_number   = parseInt(float_ops_number);
            const ops_number       = int_ops_number < float_ops_number ? int_ops_number + 1 : int_ops_number;     

            const ops = []
            for(let i=0; i<ops_number; i++){
                parameters.offset += limit;

                ops.push(this.httpClient.request('GET', this.path, parameters))
            }
            const remainingItems = await Promise.all(ops);
            remainingItems.map(page => this.items.push(...page.data.data.items))
            if(this.path === '/agents') this.items = this.items.filter(item => item.id !== '000')
            return this.items;
        
        } catch (error) {
            return Promise.reject(error);
        }
    }

    reset() {
        this.items   = [];
        this.path    = path;
        this.filters = [];
        this.sortValue = false;   
        this.sortDir   = false;     
        this.sortValue = false;
    }
}