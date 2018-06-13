/*
 * Wazuh app - Cluster monitoring controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import * as modules   from 'ui/modules'
import $ from 'jquery'
const app = modules.get('app/wazuh', []);

// Logs controller
app.controller('reportingController', function ($scope, errorHandler, genericReq) {
    $scope.loading = true;
    $scope.itemsPerPage = 20;
    $scope.pagedItems = [];
    $scope.currentPage = 0;
    let items = [];
    $scope.gap = 0;

    const load = async () => {
        try {
            $scope.loading = true;
            const data = await genericReq.request('GET','/api/wazuh-api/reports',{});
            items = data.data.list;
            const gap = items.length / 20;
            const gapInteger = parseInt(items.length / 20);
            $scope.gap = gap - parseInt(items.length / 20) > 0 ? gapInteger + 1 : gapInteger;
            if($scope.gap > 5) $scope.gap = 5;
            $scope.search();
            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
        } catch (error) {
            errorHandler.handle(error,'Reporting');
        }
    }

    load();
    
    $scope.refresh = () => load();

    $scope.deleteReport = async name => {
        try {
            $scope.loading = true;
            await genericReq.request('DELETE','/api/wazuh-api/report/' + name,{})
            await load();
            errorHandler.info('Success','Reporting');
        } catch (error) {
            errorHandler.handle(error,'Reporting');
        }
    }	

    // init the filtered items
    $scope.search = function () {
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
});