/*
 * Wazuh app - Wazuh table directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import template        from './template.html'
import { uiModules }   from 'ui/modules'
import DataFactory     from '../../services/data-factory'
import KeyEquivalenece from './key-equivalence'

const app = uiModules.get('app/wazuh', []);

app.directive('wazuhTable', function() {
    return {
        restrict: 'E',
        scope: {
            path: '=path',
            keys: '=keys',
            allowClick: '=allowClick',
            implicitFilter: '=implicitFilter',
            rowsPerPage: '=rowsPerPage'
        },
        controller: function($scope, apiReq, $timeout, shareAgent, $location, errorHandler, wzTableFilter) {            
            $scope.keyEquivalence = KeyEquivalenece;
            $scope.totalItems = 0;

            $scope.clickAction = item => {
                if(instance.path === '/agents' || new RegExp(/^\/agents\/groups\/[a-zA-Z0-9]*$/).test(instance.path)){
                    shareAgent.setAgent(item);
                    $location.search('tab', null);
                    $location.path('/agents');
                } else if(instance.path === '/agents/groups') {
                    $scope.$emit('wazuhShowGroup',{group:item})
                } else if(new RegExp(/^\/agents\/groups\/[a-zA-Z0-9]*\/files$/).test(instance.path)){
                    $scope.$emit('wazuhShowGroupFile',{groupName:instance.path.split('groups/')[1].split('/files')[0],fileName:item.filename})
                } else if(instance.path === '/rules') {
                    $scope.$emit('wazuhShowRule',{rule:item})
                } else if(instance.path === '/decoders') {
                    $scope.$emit('wazuhShowDecoder',{decoder:item})
                } else if(instance.path === '/cluster/nodes') {
                    $scope.$emit('wazuhShowClusterNode',{node:item})
                }
            }

            let realTime = false;

            $scope.wazuh_table_loading = true;
            //// PAGINATION ////////////////////
            $scope.itemsPerPage = $scope.rowsPerPage || 10;
            $scope.pagedItems = [];
            $scope.currentPage = 0;
            let items = [];
            $scope.gap = 0;
            
            // init the filtered items
            $scope.searchTable = function () {
                $scope.filteredItems = items;
                $scope.currentPage = 0;
                // now group by pages
                $scope.groupToPages();
            };

            // calculate page in place
            $scope.groupToPages = function () {
                $scope.pagedItems = [];
                
                for (let i = 0; i < $scope.filteredItems.length; i++) {
                    if (i % $scope.itemsPerPage === 0) {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
                    } else {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
                    }
                }
            };
            $scope.range = function (size,start, end) {
                const ret = [];        
                            
                if (size < end) {
                    end = size;
                    start = size-$scope.gap;
                }
                for (let i = start; i < end; i++) {
                    ret.push(i);
                }              
                return ret;
            };
        
            $scope.prevPage = function () {
                if ($scope.currentPage > 0) {
                    $scope.currentPage--;
                }
            };
            
            $scope.nextPage = function () {
                if ($scope.currentPage < $scope.pagedItems.length - 1) {
                    $scope.currentPage++;
                }
            };
            
            $scope.setPage = function () {
                $scope.currentPage = this.n;
            };
            ////////////////////////////////////

            const instance = new DataFactory(apiReq,$scope.path,$scope.implicitFilter)
            $scope.items = []

            $scope.sort = async field => {
                try {
                    $scope.wazuh_table_loading = true;
                    instance.addSorting(field.value || field);
                    $scope.sortValue = instance.sortValue;
                    $scope.sortDir   = instance.sortDir;
                    const result = await instance.fetch();
                    items = result.items;
                    $scope.time = result.time;
                    $scope.totalItems = items.length;
                    $scope.items = items;
                    checkGap();
                    $scope.searchTable();
                    $scope.wazuh_table_loading = false;
                    if(!$scope.$$phase) $scope.$digest()
                } catch (error) {
                    errorHandler.handle(error,'Data factory')
                }
                return;
            }

            const search = async (term, removeFilters) => {
                try {
                    $scope.wazuh_table_loading = true;
                    if(removeFilters) instance.removeFilters();
                    instance.addFilter('search',term);
                    wzTableFilter.set(instance.filters)
                    const result = await instance.fetch();
                    items = result.items;
                    $scope.time = result.time;
                    $scope.totalItems = items.length;
                    $scope.items = items;
                    checkGap();
                    $scope.searchTable();
                    $scope.wazuh_table_loading = false;
                    if(!$scope.$$phase) $scope.$digest()
                } catch(error) {
                    errorHandler.handle(error,'Data factory')
                }
                return;
            }

            const filter = async filter => {
                try {
                    $scope.wazuh_table_loading = true;
                    if(filter.name === 'platform' && instance.path === '/agents'){
                        const platform = filter.value.split(' - ')[0];
                        const version  = filter.value.split(' - ')[1];
                        instance.addFilter('os.platform',platform);
                        instance.addFilter('os.version',version);
                    } else {
                        instance.addFilter(filter.name,filter.value);
                    }
                    wzTableFilter.set(instance.filters)
                    const result = await instance.fetch();
                    items = result.items;
                    $scope.time = result.time;
                    $scope.totalItems = items.length;
                    $scope.items = items;
                    checkGap();
                    $scope.searchTable();
                    $scope.wazuh_table_loading = false;
                    if(!$scope.$$phase) $scope.$digest()
                } catch(error) {
                    errorHandler.handle(error,'Data factory')                    
                }
                return;
            }

            $scope.$on('wazuhUpdateInstancePath',(event,parameters) => {
                instance.path = parameters.path;
                return init();
            })

            $scope.$on('wazuhFilter',(event,parameters) => {
                return filter(parameters.filter)
            })

            $scope.$on('wazuhSearch',(event,parameters) => {
                return search(parameters.term,parameters.removeFilters)
            })

            $scope.$on('wazuhRemoveFilter',(event,parameters) => {
                instance.filters = instance.filters.filter(item => item.name !== parameters.filterName);
                wzTableFilter.set(instance.filters)
                return init();
            })

            const realTimeFunction = async () => {
                try {
                    while(realTime) {
                        const result = await instance.fetch({limit:10});
                        items = result.items;
                        $scope.time = result.time;
                        $scope.totalItems = items.length;
                        $scope.items = items;
                        checkGap();
                        $scope.searchTable();
                        if(!$scope.$$phase) $scope.$digest()
                        await $timeout(1000);
                    }    
                } catch(error) {
                    realTime = false;
                    errorHandler.handle(error,'Data factory')                    
                }
                return;
            }

            $scope.$on('wazuhPlayRealTime',() => {
                realTime = true;
                return realTimeFunction();
            })

            $scope.$on('wazuhStopRealTime',() => {
                realTime = false;
                return init();
            })

            const checkGap = () => {
                const gap = items.length / 20;
                const gapInteger = parseInt(items.length / 20);
                $scope.gap = gap - parseInt(items.length / 20) > 0 ? gapInteger + 1 : gapInteger;
                if($scope.gap > 5) $scope.gap = 5;
            }

            const init = async () => {
                try {
                    $scope.wazuh_table_loading = true;
                    const result = await instance.fetch();
                    wzTableFilter.set(instance.filters)
                    items = result.items;
                    $scope.time = result.time;
                    $scope.totalItems = items.length;
                    $scope.items = items;
                    checkGap();
                    $scope.searchTable();
                    $scope.wazuh_table_loading = false;
                    if(!$scope.$$phase) $scope.$digest()
                } catch (error) {
                    errorHandler.handle(error,'Data factory')                    
                }
                return;
            }

            init()

            const splitArray = array => {
                if(Array.isArray(array)){
                    if(!array.length) return false;
                    let str = '';
                    for(const item of array) str += `${item}, `;
                    str = str.substring(0, str.length - 2);
                    return str;
                }
                return array;
            }

            $scope.checkIfArray = item => {
                return typeof item === 'object' ? 
                       splitArray(item) :
                       item == 0 ? '0' : item;
            }

            $scope.$on('$destroy',() => {
                realTime = null;
                wzTableFilter.set([])
            })

        },
        template: template
    }
})
.service('wzTableFilter',() => {
    const filters = [];
    return {
        set: array => { if(Array.isArray(array)) { filters.length = 0; filters.push(...array) } },
        get: () => filters
    }
})
