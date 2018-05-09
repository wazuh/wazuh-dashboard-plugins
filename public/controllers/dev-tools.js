/*
 * Wazuh app - Dev tools controller
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
import jsonLint     from 'plugins/wazuh/utils/codemirror/json-lint.js'

const app = modules.get('app/wazuh', []);

// Logs controller
app.controller('devToolsController', function($scope, $rootScope, errorHandler, apiReq, $window, appState) {
    let groups = [];

    const apiInputBox = CodeMirror.fromTextArea(document.getElementById('api_input'),{
        lineNumbers      : true,
        matchBrackets    : true,
        mode             : { name: "javascript", json: true },
        theme            : 'ttcn',
        foldGutter       : true,
        styleSelectedText: true,
        gutters          : ["CodeMirror-foldgutter"]
    });

    const analyzeGroups = () => {
        try{
            const currentState = apiInputBox.getValue().toString();
            appState.setCurrentDevTools(currentState)

            const tmpgroups = [];
            const splitted  = currentState.split(/[\r\n]+(?=(?:GET|PUT|POST|DELETE)\b)/gm)
            let   start     = 0;
            let   end       = 0;

            const slen = splitted.length;
            for(let i=0; i < slen; i++){ 
                const tmp    = splitted[i].split('\n');
                const cursor = apiInputBox.getSearchCursor(tmp[0])

                if(cursor.findNext()) start = cursor.from().line
                else return false;

                end = start + tmp.length;

                const tmpRequestText     = tmp[0];
                let   tmpRequestTextJson = '';

                const tmplen = tmp.length;
                for(let j = 1; j < tmplen; ++j){
                    if(!!tmp[j]){
                        tmpRequestTextJson += tmp[j];
                    } 
                }

                if(i === slen-1 && tmpRequestTextJson && typeof tmpRequestTextJson === 'string'){
                    let rtjlen = tmp.length;
                    while(rtjlen--){
                        if(tmp[rtjlen] === '}') break;
                        else end -= 1;
                    }
                }

                if(i === slen-1 && !tmpRequestTextJson){
                    if(tmp.length > 1) end -= (tmp.length - 1)
                }

                end--;
          
                tmpgroups.push({
                    requestText    : tmpRequestText,
                    requestTextJson: tmpRequestTextJson,
                    start,
                    end
                })
            }
            
            return tmpgroups;
        } catch(error){
            return false;
        }
    }

    apiInputBox.on('change',() => {
              groups       = analyzeGroups();
        const currentState = apiInputBox.getValue().toString();
        appState.setCurrentDevTools(currentState)  
        const currentGroup = calculateWhichGroup();
        if(currentGroup){
            const hasWidget = widgets.filter(item => item.start === currentGroup.start)
            if(hasWidget.length) apiInputBox.removeLineWidget(hasWidget[0].widget)
        }
    })

    let linesWithClass = [], widgets = [];
    const highlightGroup = group => {
        for(const line of linesWithClass){
            apiInputBox.removeLineClass(line,'background',"CodeMirror-styled-background")
        }
        linesWithClass = [];
        if(group) {
            if(!group.requestTextJson) {
                linesWithClass.push(apiInputBox.addLineClass(group.start,'background',"CodeMirror-styled-background"))
                return;
            }
            for(let i=group.start; i<=group.end; i++){
                linesWithClass.push(apiInputBox.addLineClass(i,'background',"CodeMirror-styled-background"))
            }                   
        }
    }

    const checkJsonParseError = () => {
        const affectedGroups = [];
        for(const widget of widgets){
            apiInputBox.removeLineWidget(widget.widget)
        }
        widgets = [];
        for(const item of groups){
            if(item.requestTextJson){                
                try {
                    jsonLint.parse(item.requestTextJson)
                } catch(error) { 
                    affectedGroups.push(item.requestText);               
                    var msg = document.createElement("div");
                    var icon = msg.appendChild(document.createElement("span"));
                    icon.innerHTML = "!";
                    icon.className = "lint-error-icon";
                    msg.onmouseover = () => {
                        msg.removeChild(msg.lastChild)
                        msg.appendChild(document.createTextNode(error.message));
                    }
                    msg.onmouseleave = () => {
                        msg.removeChild(msg.lastChild)
                        msg.appendChild(document.createTextNode('Invalid query'));
                    }
                    msg.appendChild(document.createTextNode('Invalid query'));
                    msg.className = "lint-error";
                    widgets.push({start:item.start,widget:apiInputBox.addLineWidget(item.start, msg, {coverGutter: false, noHScroll: true})});
                }
            }
        }
        return affectedGroups;
    }

    apiInputBox.on('cursorActivity',() => {
        const currentGroup = calculateWhichGroup();
        highlightGroup(currentGroup);        
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
        groups = analyzeGroups();
        const currentGroup = calculateWhichGroup();
        highlightGroup(currentGroup);  
    }

    const apiOutputBox = CodeMirror.fromTextArea(document.getElementById('api_output'),{
        lineNumbers    : true,
        matchBrackets  : true,
        mode           : { name: "javascript", json: true },
        readOnly       : true,
        lineWrapping   : true,
        styleActiveLine: true,
        theme          : 'ttcn',
        foldGutter     : true,
        gutters        : ["CodeMirror-foldgutter"]
    });

    const calculateWhichGroup = () => {
        const selection    = apiInputBox.getCursor()
        const desiredGroup = groups.filter(item => item.end >= selection.line && item.start <= selection.line);
        return desiredGroup ? desiredGroup[0] : null;
    }

    $scope.send = async (firstTime) => {
        try {
            groups = analyzeGroups();
            
            const desiredGroup   = calculateWhichGroup();
            if(!desiredGroup) throw Error('not desired');

            if(!firstTime){
                const affectedGroups         = checkJsonParseError();
                const filteredAffectedGroups = affectedGroups.filter(item => item === desiredGroup.requestText);
                if(filteredAffectedGroups.length) {apiOutputBox.setValue('Error parsing JSON query'); return;}
            }

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

            apiOutputBox.setValue(
                desiredGroup.requestText + '\n' + 
                desiredGroup.requestTextJson  + '\n\n' + 
                JSON.stringify(output.data.data,null,2)
            )

        } catch(error) {
            error && error.data ? 
            apiOutputBox.setValue(JSON.stringify(error.data)) :
            apiOutputBox.setValue('Empty')
        }

    }

    $scope.help = () => {
        $window.open('https://documentation.wazuh.com/current/user-manual/api/reference.html');
    }

    init();
    $scope.send(true);

});
