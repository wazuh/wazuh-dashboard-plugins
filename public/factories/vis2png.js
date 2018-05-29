/*
 * Wazuh app - Fetch png from visualization div
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
import domtoimage   from 'dom-to-image'

const app = modules.get('app/wazuh', []);

app.factory('vis2png', function ($rootScope) {

    let rawArray = [];
    let htmlObject = {};    
    let working  = false;
    
    const checkArray = async visArray => {
        try {
            working = true;
            const promises = [];
            const len = visArray.length;
            for(let i=0; i < len; i++){
                const id = visArray[i]
                const tmpNode = htmlObject[id]
                try {
                    const tmpResult = await domtoimage.toPng(tmpNode[0]);
                    rawArray.push({element:tmpResult,width:tmpNode.width(),height:tmpNode.height()});
                } catch (error) {}
                $rootScope.reportStatus = `Generating report...${Math.round((i/len) * 98,2)}%`
                if(!$rootScope.$$phase) $rootScope.$digest()
            }
            working = false;
            $rootScope.reportStatus = `Generating report...98%`
            return rawArray;
        } catch (error) {
            working = false;
            return Promise.reject(error);
        }
    }

    const isWorking  = () => working;
    const clear = () => {
        rawArray = []; 
        htmlObject = {};
    }

    const assignHTMLItem = (id,content) => htmlObject[id] = content;

    return {
        checkArray,
        assignHTMLItem,
        isWorking,
        clear
    }
});