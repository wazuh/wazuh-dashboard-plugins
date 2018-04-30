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

app.controller('rulesController', function ($scope, $rootScope, Rules, RulesRelated, RulesAutoComplete, errorHandler, genericReq, appState) {

    $scope.setRulesTab = tab => $rootScope.globalsubmenuNavItem2 = tab;

    //Initialization
    $scope.loading = true;
    $scope.rules   = Rules;
    $scope.rulesRelated = RulesRelated;
    $scope.rulesAutoComplete = RulesAutoComplete;
    $scope.setRulesTab('rules');
    $scope.isArray = angular.isArray;

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
     * This function changes to the rule detail view
     */
    $scope.openDetailView = (rule) => {
        $scope.currentRule = rule;

        $scope.rulesRelated.reset();
        $scope.rulesRelated.ruleID = $scope.currentRule.id;
        $scope.rulesRelated.addFilter('file', $scope.currentRule.file);

        $scope.viewingDetail = true;
        if(!$scope.$$phase) $scope.$digest();
    }

    /**
     * This function changes to the rules list view
     */
    $scope.closeDetailView = () => {
        $scope.viewingDetail = false;
        $scope.currentRule = false;
        $scope.rulesRelated.reset();
        if(!$scope.$$phase) $scope.$digest();
    }

    const load = async () => {
        try {
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
        $scope.rules.reset();
        $scope.rulesAutoComplete.reset();
    });
});

app.controller('decodersController', function ($scope, $rootScope, $sce, Decoders, DecodersRelated, DecodersAutoComplete, errorHandler, genericReq, appState) {
    $scope.setRulesTab = tab => $rootScope.globalsubmenuNavItem2 = tab;

    //Initialization
    $scope.loading  = true;
    $scope.decoders = Decoders;
    $scope.decodersRelated = DecodersRelated;
    $scope.decodersAutoComplete = DecodersAutoComplete;
    $scope.typeFilter = "all";
    $scope.setRulesTab('decoders');
    $scope.isArray = angular.isArray;

    const colors = [
        '#3F6833', '#967302', '#2F575E', '#99440A', '#58140C', '#052B51', '#511749', '#3F2B5B', //6
        '#508642', '#CCA300', '#447EBC', '#C15C17', '#890F02', '#0A437C', '#6D1F62', '#584477', //2
        '#629E51', '#E5AC0E', '#64B0C8', '#E0752D', '#BF1B00', '#0A50A1', '#962D82', '#614D93', //4
        '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42', '#1F78C1', '#BA43A9', '#705DA0', // Normal
        '#9AC48A', '#F2C96D', '#65C5DB', '#F9934E', '#EA6460', '#5195CE', '#D683CE', '#806EB7', //5
        '#B7DBAB', '#F4D598', '#70DBED', '#F9BA8F', '#F29191', '#82B5D8', '#E5A8E2', '#AEA2E0', //3
        '#E0F9D7', '#FCEACA', '#CFFAFF', '#F9E2D2', '#FCE2DE', '#BADFF4', '#F9D9F9', '#DEDAF7' //7
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
     * This function changes to the decoder detail view
     */
    $scope.openDetailView = (decoder) => {
        $scope.currentDecoder = decoder;

        $scope.decodersRelated.reset();
        $scope.decodersRelated.path = `/decoders/${$scope.currentDecoder.name}`;
        $scope.decodersRelated.decoderPosition = $scope.currentDecoder.position;
        $scope.decodersRelated.nextPage('');

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
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
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
