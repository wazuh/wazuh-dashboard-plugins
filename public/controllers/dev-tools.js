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
import { uiModules } from 'ui/modules'
import CodeMirror    from '../utils/codemirror/lib/codemirror'
import jsonLint      from '../utils/codemirror/json-lint'
import queryString   from 'querystring-browser'

const app = uiModules.get('app/wazuh', []);

// Logs controller
app.controller('devToolsController', function($scope, apiReq, $window, appState, errorHandler, $document) {
    let groups = [];

    const apiInputBox = CodeMirror.fromTextArea($document[0].getElementById('api_input'),{
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
                let tmp    = splitted[i].split('\n');
                if(Array.isArray(tmp)) tmp = tmp.filter(item => !item.includes('#'))
                const cursor = apiInputBox.getSearchCursor(splitted[i],null,{multiline:true})

                if(cursor.findNext()) start = cursor.from().line
                else return [];

                end = start + tmp.length;

                const tmpRequestText     = tmp[0];
                let   tmpRequestTextJson = '';

                const tmplen = tmp.length;
                for(let j = 1; j < tmplen; ++j){
                    if(!!tmp[j] && !tmp[j].includes('#')){
                        tmpRequestTextJson += tmp[j];
                    } 
                }

                if(tmpRequestTextJson && typeof tmpRequestTextJson === 'string'){
                    let rtjlen = tmp.length;
                    while(rtjlen--){
                        if(tmp[rtjlen].trim() === '}') break;
                        else end -= 1;
                    }
                }

                if(!tmpRequestTextJson && tmp.length > 1) {
                    tmp = [tmp[0]]
                    end = start + 1
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
            return [];
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
            setTimeout(() => checkJsonParseError(),450)
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
                    const msg = $document[0].createElement("div");
                    msg.id = new Date().getTime()/1000;
                    const icon = msg.appendChild($document[0].createElement("div"));
          
                    icon.className = "lint-error-icon";
                    icon.id = new Date().getTime()/1000;
                    icon.onmouseover = () => {
                        const advice = msg.appendChild($document[0].createElement("span"));
                        advice.id = new Date().getTime()/1000;
                        advice.innerText = error.message || 'Error parsing query'
                        advice.className = 'lint-block-wz'
                    }

                    icon.onmouseleave = () => {
                        msg.removeChild(msg.lastChild)
                    }

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
            const demoStr = 'GET /\n\n# Comment here\nGET /agents\n' + JSON.stringify({limit:1},null,2);
            appState.setCurrentDevTools(demoStr);
            apiInputBox.getDoc().setValue(demoStr);
        } else {
            apiInputBox.getDoc().setValue(currentState)
        }
        groups = analyzeGroups();
        const currentGroup = calculateWhichGroup();
        highlightGroup(currentGroup); 
    }

    const apiOutputBox = CodeMirror.fromTextArea($document[0].getElementById('api_output'),{
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
        try {
            const selection    = apiInputBox.getCursor()
            const desiredGroup = groups.filter(item => item.end >= selection.line && item.start <= selection.line);

            // Place play button at first line from the selected group
            const cords = apiInputBox.cursorCoords({line:desiredGroup[0].start,ch:0});
            if(!$('#play_button').is(":visible")) $('#play_button').show()
            const currentPlayButton = $('#play_button').offset();
            $('#play_button').offset({top:cords.top,left:currentPlayButton.left})
            
            return desiredGroup[0];
        } catch(error) {
            $('#play_button').hide()
            return null;
        }

    }

    $scope.send = async firstTime => {
        try {
            groups = analyzeGroups();
            
            const desiredGroup   = calculateWhichGroup();
            if(!desiredGroup) throw Error('not desired');
            if(firstTime){
                const cords = apiInputBox.cursorCoords({line:desiredGroup.start,ch:0});
                const currentPlayButton = $('#play_button').offset();
                $('#play_button').offset({top:cords.top+10,left:currentPlayButton.left})
            }

            const affectedGroups         = checkJsonParseError();
            const filteredAffectedGroups = affectedGroups.filter(item => item === desiredGroup.requestText);
            if(filteredAffectedGroups.length) {apiOutputBox.setValue('Error parsing JSON query'); return;}
      

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

            // Checks for inline parameters
            const inlineSplit = requestCopy.split('?');

            const extra = inlineSplit && inlineSplit[1] ? 
                          queryString.parse(inlineSplit[1]) :
                          {};
           
            const req = requestCopy ?
                        requestCopy.startsWith('/') ? 
                        requestCopy :  
                        `/${requestCopy}` :
                        '/';

            let JSONraw = {};
            try {
                JSONraw = JSON.parse(desiredGroup.requestTextJson);
            } catch(error) {
                JSONraw = {}
            }

            if(typeof extra.pretty !== 'undefined')   delete extra.pretty;
            if(typeof JSONraw.pretty !== 'undefined') delete JSONraw.pretty;

            // Assign inline parameters
            for(const key in extra) JSONraw[key] = extra[key];

            const path   = req.includes('?') ? req.split('?')[0] : req;

            if(typeof JSONraw === 'object') JSONraw.devTools = true;
            const output = await apiReq.request(method, path, JSONraw)

            apiOutputBox.setValue(
                JSON.stringify(output.data.data,null,2)
            )

        } catch(error) {
            const parsedError = errorHandler.handle(error,null,null,true);
            if(typeof parsedError === 'string') {
                return apiOutputBox.setValue(parsedError);
            } else if(error && error.data && typeof error.data === 'object') {
                return apiOutputBox.setValue(JSON.stringify(error.data))
            } else {
                return apiOutputBox.setValue('Empty')
            }
        }

    }

    $scope.help = () => {
        $window.open('https://documentation.wazuh.com/current/user-manual/api/reference.html');
    }

    init();
    $scope.send(true);

});
