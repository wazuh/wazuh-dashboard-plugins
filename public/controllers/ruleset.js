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
import { uiModules }   from 'ui/modules'
import * as FileSaver from '../services/file-saver'

const app = uiModules.get('app/wazuh', []);

app.controller('rulesController', function ($timeout, $scope, $rootScope, $sce, errorHandler, genericReq, appState, csvReq) {
    $scope.implicitFilterFromDetail = false;
    $scope.appliedFilters = [];
    $scope.search = term => {
        if(term.startsWith('group:') && term.split('group:')[1].trim()) {
            $scope.custom_search = ''
            const filter = {name:'group',value:term.split('group:')[1].trim()};
            $scope.appliedFilters.push(filter)
            $scope.$broadcast('wazuhFilter',{filter})
        } else if(term.startsWith('level:') && term.split('level:')[1].trim()) {
            $scope.custom_search = ''
            const filter = {name:'level',value:term.split('level:')[1].trim()};
            $scope.appliedFilters.push(filter)
            $scope.$broadcast('wazuhFilter',{filter})
        } else if(term.startsWith('pci:') && term.split('pci:')[1].trim()) {
            $scope.custom_search = ''
            const filter = {name:'pci',value:term.split('pci:')[1].trim()};
            $scope.appliedFilters.push(filter)
            $scope.$broadcast('wazuhFilter',{filter})
        } else if(term.startsWith('gdpr:') && term.split('gdpr:')[1].trim()) {
            $scope.custom_search = ''
            const filter = {name:'gdpr',value:term.split('gdpr:')[1].trim()};
            $scope.appliedFilters.push(filter)
            $scope.$broadcast('wazuhFilter',{filter})
        } else if(term.startsWith('file:') && term.split('file:')[1].trim()) {
            $scope.custom_search = ''
            const filter = {name:'file',value:term.split('file:')[1].trim()};
            $scope.appliedFilters.push(filter)
            $scope.$broadcast('wazuhFilter',{filter})
        } else {
            $scope.$broadcast('wazuhSearch',{term,removeFilters: true})
        }
    }

    $scope.includesFilter = filterName => {
        return $scope.appliedFilters.filter(item => item.name === filterName).length ||
               $scope.implicitFilterFromDetail && $scope.implicitFilterFromDetail.name === filterName;
    }
    $scope.getFilter      = filterName => {
        const filtered = $scope.appliedFilters.filter(item => item.name === filterName);
        return filtered.length ? filtered[0].value :  $scope.implicitFilterFromDetail.value;
    }
    $scope.removeFilter   = filterName => {
        $scope.implicitFilterFromDetail = false;
        $scope.appliedFilters = $scope.appliedFilters.filter(item => item.name !== filterName);
        return $scope.$broadcast('wazuhRemoveFilter',{filterName});
    }

    $scope.setRulesTab = tab => $rootScope.globalsubmenuNavItem2 = tab;

    //Initialization
    $scope.searchTerm = '';
    $scope.viewingDetail = false;
    $scope.setRulesTab('rules');
    $scope.isArray = angular.isArray;

    const colors = [
        '#004A65', '#00665F', '#BF4B45', '#BF9037', '#1D8C2E', 'BB3ABF',
        '#00B1F1', '#00F2E2', '#7F322E', '#7F6025', '#104C19', '7C267F',
        '#0079A5', '#00A69B', '#FF645C', '#FFC04A', '#2ACC43', 'F94DFF',
        '#0082B2', '#00B3A7', '#401917', '#403012', '#2DD947', '3E1340',
        '#00668B', '#008C83', '#E55A53', '#E5AD43', '#25B23B', 'E045E5'
    ];

    $scope.colorRuleArg = ruleArg => {
        ruleArg = ruleArg.toString();
        let valuesArray   = ruleArg.match(/\$\(((?!<\/span>).)*?\)(?!<\/span>)/gmi);
        let coloredString = ruleArg;

        // If valuesArray is empty, means that the description doesn't have any arguments
        // In this case, then simply return the string
        // In other case, then colour the string and return
        if (valuesArray && valuesArray.length) {
            for (let i = 0, len = valuesArray.length; i < len; i++) {
                coloredString = coloredString.replace(/\$\(((?!<\/span>).)*?\)(?!<\/span>)/mi, '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
            }
        }

        return $sce.trustAsHtml(coloredString);
    };

    // Reloading event listener
    $scope.$on('rulesetIsReloaded',() => {
        $scope.viewingDetail = false;
        if(!$scope.$$phase) $scope.$digest();
    });

    $scope.downloadCsv = async () => {
        try {
            errorHandler.info('Your download should begin automatically...', 'CSV')
            const currentApi   = JSON.parse(appState.getCurrentAPI()).id;
            const output       = await csvReq.fetch('/rules', currentApi, null);
            const blob         = new Blob([output], {type: 'text/csv'});

            FileSaver.saveAs(blob, 'rules.csv');
            
            return;

        } catch (error) {
            errorHandler.handle(error,'Download CSV');
        }
        return;
    }

    /**
     * This function takes back to the list but adding a filter from the detail view
     */
    $scope.addDetailFilter = (name, value) => {
        $scope.implicitFilterFromDetail = {name,value}
        // Clear the autocomplete component
        $scope.searchTerm = '';
        // Go back to the list
        $scope.closeDetailView();
    }

    $scope.$on('wazuhShowRule',(event,parameters) => {
        $scope.currentRule = parameters.rule;
        $scope.viewingDetail = true;
        if(!$scope.$$phase) $scope.$digest();
    })

    /**
     * This function changes to the rules list view
     */
    $scope.closeDetailView = clear => {
        if(clear) $scope.implicitFilterFromDetail = false;
        $scope.viewingDetail = false;
        $scope.currentRule = false;
        if(!$scope.$$phase) $scope.$digest();
    }

});

app.controller('decodersController', function ($timeout, $scope, $rootScope, $sce, Decoders, DecodersRelated, DecodersAutoComplete, errorHandler, genericReq, appState, csvReq) {
    $scope.setRulesTab = tab => $rootScope.globalsubmenuNavItem2 = tab;

    //Initialization
    $scope.searchTerm = '';
    $scope.loading  = true;
    $scope.viewingDetail = false;
    $scope.decoders = Decoders;
    $scope.decodersRelated = DecodersRelated;
    $scope.decodersAutoComplete = DecodersAutoComplete;
    $scope.typeFilter = "all";
    $scope.setRulesTab('decoders');
    $scope.isArray = angular.isArray;

    const colors = [
        '#004A65', '#00665F', '#BF4B45', '#BF9037', '#1D8C2E', 'BB3ABF',
        '#00B1F1', '#00F2E2', '#7F322E', '#7F6025', '#104C19', '7C267F',
        '#0079A5', '#00A69B', '#FF645C', '#FFC04A', '#2ACC43', 'F94DFF',
        '#0082B2', '#00B3A7', '#401917', '#403012', '#2DD947', '3E1340',
        '#00668B', '#008C83', '#E55A53', '#E5AD43', '#25B23B', 'E045E5'
    ];

    $scope.colorRegex = regex => {
        regex = regex.toString();
        let valuesArray   = regex.match(/\(((?!<\/span>).)*?\)(?!<\/span>)/gmi);
        let coloredString = regex;
        for (let i = 0, len = valuesArray.length; i < len; i++) {
            coloredString = coloredString.replace(/\(((?!<\/span>).)*?\)(?!<\/span>)/mi, '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

    $scope.colorOrder = order => {
        order = order.toString();
        let valuesArray   = order.split(',');
        let coloredString = order;
        for (let i = 0, len = valuesArray.length; i < len; i++) {
            coloredString = coloredString.replace(valuesArray[i], '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

    // Reloading event listener
    $scope.$on('rulesetIsReloaded',() => {
        $scope.viewingDetail = false;
        if(!$scope.$$phase) $scope.$digest();
    });

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

    $scope.analyzeDecoders = async search => {
        try {
            if(search && search.length <= 1) return $scope.decodersAutoComplete.items;
            await $timeout(200);

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
        }
        return;
    }

    $scope.downloadCsv = async () => {
        try {
            const currentApi   = JSON.parse(appState.getCurrentAPI()).id;
            const output       = await csvReq.fetch('/decoders', currentApi, $scope.decoders ? $scope.decoders.filters : null);
            const blob         = new Blob([output], {type: 'text/csv'});

            FileSaver.saveAs(blob, 'decoders.csv');
            
            return;

        } catch (error) {
            errorHandler.handle(error,'Download CSV');
        }
        return;
    }

    /**
     * This function takes back to the list but adding a filter from the detail view
     */
    $scope.addDetailFilter = (name, value) => {
        // Remove all previous filters and then add it
        $scope.decoders.removeAllFilters();
        $scope.decoders.addFilter(name, value);

        // Clear the autocomplete component
        $scope.searchTerm = '';
        angular.element(document.querySelector('#autocomplete')).blur();

        // Go back to the list
        $scope.closeDetailView();
    }

    /**
     * This function changes to the decoder detail view
     */
    $scope.openDetailView = (decoder) => {
        // Clear current decoder variable and assign the new one
        $scope.currentDecoder = false;
        $scope.currentDecoder = decoder;

        // Create the related decoders list, resetting it in first place
        $scope.decodersRelated.reset();
        $scope.decodersRelated.path = `/decoders/${$scope.currentDecoder.name}`;
        $scope.decodersRelated.decoderPosition = $scope.currentDecoder.position;
        $scope.decodersRelated.nextPage('');

        // Enable the Detail view
        $scope.viewingDetail = true;
        if(!$scope.$$phase) $scope.$digest();
    }

    /**
     * This function changes to the decoders list view
     */
    $scope.closeDetailView = () => {
        $scope.viewingDetail = false;
        $scope.currentDecoder = false;
        $scope.decodersRelated.reset();
        if(!$scope.$$phase) $scope.$digest();
    }

    const load = async () => {
        try {
            await Promise.all([
                $scope.decoders.nextPage(),
                $scope.decodersAutoComplete.nextPage()
            ]);

            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Ruleset');
        }
        return;
    }

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", () => {
        $scope.decoders.reset();
        $scope.decodersRelated.reset();
        $scope.decodersAutoComplete.reset();
    });
});
