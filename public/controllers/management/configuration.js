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
import beautifier    from '../../utils/json-beautifier';
import js2xmlparser  from 'js2xmlparser';
import XMLBeautifier from '../../utils/xml-beautifier';

const app = uiModules.get('app/wazuh', []);

app.controller('managerConfigurationController', function ($scope, errorHandler, apiReq) {
    //Initialization
    $scope.load    = true;
    $scope.isArray = Array.isArray;

    $scope.switchItem = item => {
        $scope.XMLContent   = false;
        $scope.JSONContent  = false;
        $scope.selectedItem = item;
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.getXML = name => {
        $scope.JSONContent = false;
        if($scope.XMLContent){
            $scope.XMLContent = false;
        } else {
            try {
                $scope.XMLContent = XMLBeautifier(js2xmlparser.parse(name,configRaw[name]));
            } catch (error) { $scope.XMLContent = false; }
        }        
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.getJSON = name => {
        $scope.XMLContent = false;
        if($scope.JSONContent){
            $scope.JSONContent = false;
        } else {
            try {
                $scope.JSONContent = beautifier.prettyPrint(configRaw[name]);
            } catch (error) { $scope.JSONContent = false; }
        }
        if(!$scope.$$phase) $scope.$digest();
    }
    const configRaw = {};
    //Functions
    const load = async () => {
        try{
            const data = await apiReq.request('GET', '/manager/configuration', {});
            Object.assign(configRaw,angular.copy(data.data.data))
            $scope.managerConfiguration = data.data.data;

            if($scope.managerConfiguration && $scope.managerConfiguration['active-response']){

                for(const ar of $scope.managerConfiguration['active-response']) {
                    const rulesArray = ar.rules_id ?
                    ar.rules_id.split(',') :
                                       [];
                    if(ar.rules_id && rulesArray.length > 1){
                        const tmp = [];

                        for(const id of rulesArray){
                            const rule = await apiReq.request('GET',`/rules/${id}`,{});
                            tmp.push(rule.data.data.items[0]);
                        }

                        ar.rules = tmp;
                    } else if(ar.rules_id){
                        const rule = await apiReq.request('GET',`/rules/${ar.rules_id}`,{});
                        ar.rule = rule.data.data.items[0];
                    }
                }
            }

            $scope.raw  = beautifier.prettyPrint(data.data.data);
            $scope.load = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Manager');
        }
        return;
    };

    load();
    $scope.$on("$destroy", () => {

    });
});
