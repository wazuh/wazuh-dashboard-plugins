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
    constructor(httpClient, path, implicitFilter){
        this.implicitFilter = implicitFilter || false;
        this.httpClient = httpClient;
        this.items   = [];
        this.path    = path;
        this.filters = [];
        this.sortValue = false;   
        this.sortDir   = false;     
        this.sortValue = false;
        if(this.implicitFilter) this.filters.push(this.implicitFilter);
    }

    addSorting(value) {
        this.sortValue = value;
        this.sortDir   = !this.sortDir;
    }

    removeFilters(){
        this.filters = [];
        if(this.implicitFilter) this.filters.push(this.implicitFilter);
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
            const start = new Date();

            // If offset is not given, it means we need to start again
            if(!options.offset) this.items = [];       
            const offset     = options.offset || 0;
            const limit      = options.limit || 500;
            const parameters = { limit,offset };
            
            this.serializeFilters(parameters);

            // Fetch next <limit> items
            const firstPage = await this.httpClient.request('GET', this.path, parameters);
            this.items = this.items.filter(item => !!item);
            this.items.push(...firstPage.data.data.items);

            const totalItems = firstPage.data.data.totalItems;

            const remaining  = this.items.length === totalItems ? 0 :
                               totalItems-firstPage.data.data.items.length-this.items.length;

            // Ignore manager as an agent, once the team solves this issue, review this line
            if(this.path === '/agents') this.items = this.items.filter(item => item.id !== '000');

            if(remaining > 0 )this.items.push(...Array(remaining).fill(null));

            const end = new Date();
            const elapsed = (end - start) / 1000;

            return {items:this.items, time:elapsed};
        
        } catch (error) {
            return Promise.reject(error);
        }
    }

    reset() {
        this.items   = [];
        this.filters = [];
        if(this.implicitFilter) this.filters.push(this.implicitFilter);
        this.sortValue = false;   
        this.sortDir   = false;     
        this.sortValue = false;
    }
}