/*
 * Wazuh app - Management configuration controller
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
import angular       from 'angular';
import js2xmlparser  from 'js2xmlparser';
import XMLBeautifier from '../../utils/xml-beautifier';
import beautifier    from '../../utils/json-beautifier';

const app = uiModules.get('app/wazuh', []);

class NewConfigurationController {
    constructor($scope, errorHandler, apiReq) {
        this.$scope         = $scope;
        this.errorHandler   = errorHandler;
        this.apiReq         = apiReq;
        this.$scope.load    = true;
        this.$scope.isArray = Array.isArray;
        this.configRaw      = {};

        this.$scope.configurationTab    = 'welcome';
        this.$scope.configurationSubTab = 'open-scap';

        this.$scope.switchItem                = item => this.switchItem(item);
        this.$scope.getXML                    = name => this.getXML(name);
        this.$scope.getJSON                   = name => this.getJSON(name);
        this.$scope.switchConfigurationTab    = configurationTab => this.switchConfigurationTab(configurationTab);
        this.$scope.switchConfigurationSubTab = configurationSubTab => this.switchConfigurationSubTab(configurationSubTab);
    }

    /**
     * Initialize
     */
    $onInit() {
        this.load();
    }

    /**
     * Switchs between configuration sections
     * @param {*} configurationTab
     */
    switchConfigurationTab(configurationTab) {
        this.$scope.configurationTab = configurationTab;
        if(!this.$scope.$$phase) this.$scope.$digest();
    }

    /**
     * Switchs between configuration sections
     * @param {*} configurationSubTab
     */
    switchConfigurationSubTab(configurationSubTab) {
        this.$scope.configurationSubTab = configurationSubTab;
        if(!this.$scope.$$phase) this.$scope.$digest();
    }

    /**
     * Switchs between configuration sections
     * @param {*} item
     */
    switchItem(item) {
        this.$scope.XMLContent   = false;
        this.$scope.JSONContent  = false;
        this.$scope.selectedItem = item;
        if(!this.$scope.$$phase) this.$scope.$digest();
    }

    /**
     * Assigns XML raw content for specific configuration
     * @param {string} name Name of the configuration section
     */
    getXML(name) {
        this.$scope.JSONContent = false;
        if(this.$scope.XMLContent){
            this.$scope.XMLContent = false;
        } else {
            try {
                this.$scope.XMLContent = XMLBeautifier(js2xmlparser.parse(name, this.configRaw[name]));
            } catch (error) { this.$scope.XMLContent = false; }
        }
        if(!this.$scope.$$phase) this.$scope.$digest();
    }

    /**
     * Assigns JSON raw content for specific configuration
     * @param {string} name Name of the configuration section
     */
    getJSON(name) {
        this.$scope.XMLContent = false;
        if(this.$scope.JSONContent){
            this.$scope.JSONContent = false;
        } else {
            try {
                this.$scope.JSONContent = beautifier.prettyPrint(this.configRaw[name]);
            } catch (error) { this.$scope.JSONContent = false; }
        }
        if(!this.$scope.$$phase) this.$scope.$digest();
    }

    /**
     * Fetchs required data
     */
    async load() {
        try{
            const data = await this.apiReq.request('GET', '/manager/configuration', {});
            Object.assign(this.configRaw, angular.copy(data.data.data))
            this.$scope.managerConfiguration = data.data.data;

            if(this.$scope.managerConfiguration && this.$scope.managerConfiguration['active-response']){

                for(const ar of this.$scope.managerConfiguration['active-response']) {
                    const rulesArray = ar.rules_id ?
                    ar.rules_id.split(',') :
                                       [];
                    if(ar.rules_id && rulesArray.length > 1){
                        const tmp = [];

                        for(const id of rulesArray){
                            const rule = await this.apiReq.request('GET',`/rules/${id}`,{});
                            tmp.push(rule.data.data.items[0]);
                        }

                        ar.rules = tmp;
                    } else if(ar.rules_id){
                        const rule = await this.apiReq.request('GET',`/rules/${ar.rules_id}`,{});
                        ar.rule = rule.data.data.items[0];
                    }
                }
            }

            this.$scope.raw  = beautifier.prettyPrint(data.data.data);
            this.$scope.load = false;
            if(!this.$scope.$$phase) this.$scope.$digest();
            return;
        } catch (error) {
            this.errorHandler.handle(error,'Manager');
        }
        return;
    }
}

app.controller('managementNewConfigurationController', NewConfigurationController);
