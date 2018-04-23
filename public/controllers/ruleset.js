/*
 * Wazuh app - Ruleset controllers
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

app.controller('rulesController', function ($scope, $rootScope, Rules, RulesAutoComplete, errorHandler, genericReq, appState) {

    $scope.setRulesTab = tab => $rootScope.globalsubmenuNavItem2 = tab;

    //Initialization
    $scope.loading = true;
    $scope.rules   = Rules;
    $scope.rulesAutoComplete = RulesAutoComplete;
    $scope.setRulesTab('rules');
    $rootScope.tabVisualizations = { ruleset: 4 };
    $scope.analizeRules = async search => {
        try {
            $scope.rulesAutoComplete.filters = [];

            if(search.startsWith('group:') && search.split('group:')[1].trim()) {
                await $scope.rulesAutoComplete.addFilter('group',search.split('group:')[1].trim());
            } else if(search.startsWith('level:') && search.split('level:')[1].trim()) {
                await $scope.rulesAutoComplete.addFilter('level',search.split('level:')[1].trim());
            } else if(search.startsWith('pci:') && search.split('pci:')[1].trim()) {
                await $scope.rulesAutoComplete.addFilter('pci',search.split('pci:')[1].trim());
            } else if(search.startsWith('file:') && search.split('file:')[1].trim()) {
                await $scope.rulesAutoComplete.addFilter('file',search.split('file:')[1].trim());
            } else {
                await $scope.rulesAutoComplete.addFilter('search',search);
            }

            if(!$scope.$$phase) $scope.$digest();
            return $scope.rulesAutoComplete.items;
        } catch (error){
            errorHandler.handle(error,'Ruleset');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    }

    $scope.checkEnter = search => {
        $scope.searchTerm = '';
        angular.element(document.querySelector('#autocomplete')).blur();
        if(search.startsWith('group:') && search.split('group:')[1].trim()) {
            $scope.rules.addFilter('group',search.split('group:')[1].trim());
        } else if(search.startsWith('level:') && search.split('level:')[1].trim()) {
            $scope.rules.addFilter('level',search.split('level:')[1].trim());
        } else if(search.startsWith('pci:') && search.split('pci:')[1].trim()) {
            $scope.rules.addFilter('pci',search.split('pci:')[1].trim());
        } else if(search.startsWith('file:') && search.split('file:')[1].trim()) {
            $scope.rules.addFilter('file',search.split('file:')[1].trim());
        } else {
            $scope.rules.addFilter('search',search.trim());
        }
    };

    /**
     * This function takes back to the list but adding a group filter
     */
    $scope.addGroupFilter = (name) => {
        // Clear the autocomplete component
        $scope.searchTerm = '';
        angular.element(document.querySelector('#autocomplete')).blur();

        // Add the filter and go back to the list
        $scope.rules.addFilter('group', name);
        $scope.closeDetailView();
    }

    /**
     * This function takes back to the list but adding a PCI filter
     */
    $scope.addPciFilter = (name) => {
        // Clear the autocomplete component
        $scope.searchTerm = '';
        angular.element(document.querySelector('#autocomplete')).blur();

        // Add the filter and go back to the list
        $scope.rules.addFilter('pci', name);
        $scope.closeDetailView();
    }

    /**
     * This function changes to the detail view
     */
    $scope.openDetailView = (rule) => {
        $scope.currentRule = rule;
        $scope.viewingDetail = true;
    }

    /**
     * This function changes to the list view
     */
    $scope.closeDetailView = () => {
        $scope.viewingDetail = false;
        $scope.currentRule = false;
        if(!$scope.$$phase) $scope.$digest();
    }

    const load = async () => {
        try {
            $rootScope.rawVisualizations = null;
            const data = await genericReq.request('GET',`/api/wazuh-elastic/create-vis/manager-ruleset-rules/${appState.getCurrentPattern()}`)
            $rootScope.rawVisualizations = data.data.raw;
            // Render visualizations
            $rootScope.$broadcast('updateVis');
            if(!$rootScope.$$phase) $rootScope.$digest();

            await Promise.all([
                $scope.rules.nextPage(),
                $scope.rulesAutoComplete.nextPage()
            ]);
            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle('Unexpected exception loading controller','Ruleset');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    }

    //Load
    load();

    let timesOpened = 0;
    let lastName = false;
    $scope.closeOther = rule => {
        const item = rule.id ? rule.id : rule;
        if(item !== lastName){
            lastName = item;
            timesOpened = 0;
        }
        timesOpened++;
        $scope.activeItem = (timesOpened <= 1) ? item : false;
        if(timesOpened > 1) timesOpened = 0;
        return true;
    }

    //Destroy
    $scope.$on('$destroy', () => {
        $rootScope.rawVisualizations = null;
        $scope.rules.reset();
        if($rootScope.ownHandlers){
            for(let h of $rootScope.ownHandlers){
                h._scope.$destroy();
            }
        }
        $rootScope.ownHandlers = [];
    });
});

app.controller('decodersController', function ($scope, $rootScope, Decoders, DecodersAutoComplete, errorHandler, genericReq, appState) {
    $scope.setRulesTab = tab => $rootScope.globalsubmenuNavItem2 = tab;

    //Initialization
    $scope.loading  = true;
    $scope.decoders = Decoders;
    $scope.decodersAutoComplete = DecodersAutoComplete;
    $scope.typeFilter = "all";
    $scope.setRulesTab('decoders');
    $rootScope.tabVisualizations = { ruleset: 1 };

    let timesOpened = 0;
    let lastName = false;
    $scope.closeOther = name => {
        if(name !== lastName){
            lastName = name;
            timesOpened = 0;
        }
        timesOpened++;
        $scope.activeItem = (timesOpened <= 1) ? name : false;
        if(timesOpened > 1) timesOpened = 0;
        return true;
    }

    $scope.checkEnter = search => {
        $scope.searchTerm = '';
        angular.element(document.querySelector('#autocomplete')).blur();
        if(search.startsWith('path:') && search.split('path:')[1].trim()) {
            $scope.decoders.addFilter('path',search.split('path:')[1].trim());
        } else if(search.startsWith('file:') && search.split('file:')[1].trim()) {
            $scope.decoders.addFilter('file',search.split('file:')[1].trim());
        } else {
            $scope.decoders.addFilter('search',search.trim());
        }
    };

    $scope.analizeDecoders = async search => {
        try {
            $scope.decodersAutoComplete.filters = [];

            if(search.startsWith('path:') && search.split('path:')[1].trim()) {
                await $scope.decodersAutoComplete.addFilter('path',search.split('path:')[1].trim());
            } else if(search.startsWith('file:') && search.split('file:')[1].trim()) {
                await $scope.decodersAutoComplete.addFilter('file',search.split('file:')[1].trim());
            } else {
                await $scope.decodersAutoComplete.addFilter('search',search);
            }

            if(!$scope.$$phase) $scope.$digest();
            return $scope.decodersAutoComplete.items;
        } catch (error){
            errorHandler.handle(error,'Ruleset');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    }

    /**
     * This function changes to the detail view
     */
    $scope.openDetailView = (decoder) => {
        $scope.currentDecoder = decoder;
        $scope.viewingDetail = true;
    }

    /**
     * This function changes to the list view
     */
    $scope.closeDetailView = () => {
        $scope.viewingDetail = false;
        $scope.currentDecoder = false;
        if(!$scope.$$phase) $scope.$digest();
    }

    const load = async () => {
        try {
            $rootScope.rawVisualizations = null;
            const data = await genericReq.request('GET',`/api/wazuh-elastic/create-vis/manager-ruleset-decoders/${appState.getCurrentPattern()}`)
            $rootScope.rawVisualizations = data.data.raw;
            // Render visualizations
            $rootScope.$broadcast('updateVis');
            if(!$rootScope.$$phase) $rootScope.$digest();

            await Promise.all([
                $scope.decoders.nextPage(),
                $scope.decodersAutoComplete.nextPage()
            ]);

            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Ruleset');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    }

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", () => {
        $scope.decoders.reset();
        if($rootScope.ownHandlers){
            for(let h of $rootScope.ownHandlers){
                h._scope.$destroy();
            }
        }
        $rootScope.ownHandlers = [];
    });
});
