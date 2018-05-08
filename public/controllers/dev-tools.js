/*
 * Wazuh app - Blank screen controller
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
import beautifier   from 'plugins/wazuh/utils/json-beautifier'
import CodeMirror   from 'plugins/wazuh/utils/codemirror/lib/codemirror'

const app = modules.get('app/wazuh', []);

// Logs controller
app.controller('devToolsController', function($scope, $rootScope, errorHandler, apiReq, $window, appState) {
    let groups = [];
    const analyzeGroups = () => {
        try{
            const currentState = apiInputBox.getValue().toString();
            appState.setCurrentDevTools(currentState)
            const groups = [];
            const splitted = currentState.split(/[\r\n]+(?=(?:GET|PUT|POST|DELETE)\b)/gm)
            let start = 0, end = 0; 
            let lastElement = null;
            for(let i=0; i<splitted.length; i++){ 
                start = lastElement ? lastElement.length + i : i;               
                const tmp = splitted[i].split('\n');
                end = start + tmp.length;
                lastElement = tmp;
                const tmpRequestText = tmp[0];
                let tmpRequestTextJson = '';
                let j=1;
                for(j=1; j<tmp.length; j++){
                    if(!!tmp[j]){
                        tmpRequestTextJson += tmp[j];
                    }
                }
                groups.push({
                    requestText: tmpRequestText,
                    requestTextJson: tmpRequestTextJson,
                    start,
                    end
                })
            }
            return groups;
        } catch(error){
            return false;
        }
    }

    const apiInputBox = CodeMirror.fromTextArea(document.getElementById('api_input'),{
        lineNumbers : true,
        matchBrackets: true,
        mode:  {name:"javascript",json:true},
        styleActiveLine: true,
        theme:'ttcn',
        foldGutter: true,
        gutters: ["CodeMirror-foldgutter"]
    });

    apiInputBox.on('change',() => {
        const currentState = apiInputBox.getValue().toString();
        appState.setCurrentDevTools(currentState)
    })

    const init = () => {
        apiInputBox.setSize('auto','100%')
        apiOutputBox.setSize('auto','100%')
        const currentState = appState.getCurrentDevTools();
        if(!currentState){
            const demoStr = 'GET /\n\nGET /agents\n' + JSON.stringify({limit:1},null,2);
            appState.setCurrentDevTools(demoStr);
            apiInputBox.getDoc().setValue(demoStr);
        } else {
            apiInputBox.getDoc().setValue(currentState)
        }
    }

    const apiOutputBox = CodeMirror.fromTextArea(document.getElementById('api_output'),{
        lineNumbers : true,
        matchBrackets: true,
        mode:  {name:"javascript",json:true},
        readOnly: true,
        lineWrapping: true,
        styleActiveLine: true,
        theme:'ttcn',
        foldGutter: true,
        gutters: ["CodeMirror-foldgutter"]
    });

    const calculateWhichGroup = () => {
        const selection = apiInputBox.getCursor()
        const desiredGroup = groups.filter(item => item.end >= selection.line && item.start <= selection.line);
        return desiredGroup ? desiredGroup[0] : null;
    }

    $scope.send = async () => {
        try {
            groups = analyzeGroups();
            const desiredGroup = calculateWhichGroup();
            
            const method = desiredGroup.requestText.startsWith('GET') ? 
                           'GET' :
                           desiredGroup.requestText.startsWith('POST') ?
                           'POST' :
                           desiredGroup.requestText.startsWith('PUT') ?
                           'PUT' :
                           desiredGroup.requestText.startsWith('DELETE') ?
                           'DELETE' :
                           'GET';

            const requestCopy = desiredGroup.requestText.includes(method) ?
                                desiredGroup.requestText.split(method)[1].trim() :
                                desiredGroup.requestText;

            const req = requestCopy ?
                        requestCopy.startsWith('/') ? 
                        requestCopy :  
                        `/${requestCopy}` :
                        '/';

            let validJSON = true, JSONraw = {};
            try {
                JSONraw = JSON.parse(desiredGroup.requestTextJson);
            } catch(error) {
                validJSON = false;
            }

            const path   = req.includes('?') ? req.split('?')[0] : req;
            const params = req.includes('?') ? parseParams(req.split('?')[1]) : {}
            const output = await apiReq.request(method, path, validJSON && !req.includes('?') ? JSONraw : params)

            apiOutputBox.setValue(JSON.stringify(output.data.data,null,2))

        } catch(error) {
            console.log(error.message || error)
            $scope.output = beautifier.prettyPrint(error.data);
            if(!$scope.$$phase) $scope.$digest();
        }

    }

    $scope.help = () => {
        $window.open('https://documentation.wazuh.com/current/user-manual/api/reference.html');
    }

    init();
    $scope.send();

});
