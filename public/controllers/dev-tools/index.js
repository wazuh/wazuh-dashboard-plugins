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
import { uiModules } from 'ui/modules';
import CodeMirror from '../../utils/codemirror/lib/codemirror';
import jsonLint from '../../utils/codemirror/json-lint';
import queryString from 'querystring-browser';
import $ from 'jquery';

const app = uiModules.get('app/wazuh', []);

class DevToolsController {
  constructor($scope, apiReq, $window, appState, errorHandler, $document) {
    this.$scope = $scope;
    this.apiReq = apiReq;
    this.$window = $window;
    this.appState = appState;
    this.errorHandler = errorHandler;
    this.$document = $document;
    this.groups = [];
    this.linesWithClass = [];
    this.widgets = [];
    this.apiModel = {};
  }

  $onInit() {


    this.apiInputBox = CodeMirror.fromTextArea(
      this.$document[0].getElementById('api_input'),
      {
        lineNumbers: true,
        matchBrackets: true,
        mode: { name: 'javascript', json: true },
        theme: 'ttcn',
        foldGutter: true,
        styleSelectedText: true,
        gutters: ['CodeMirror-foldgutter']
      }
    );
    CodeMirror.commands.autocomplete = function (cm) {
      CodeMirror.showHint(cm, CodeMirror.hint.dictionaryHint, {
        completeSingle: false
      });
    };

    this.apiInputBox.on('change', () => {
      this.groups = this.analyzeGroups();
      const currentState = this.apiInputBox.getValue().toString();
      this.appState.setCurrentDevTools(currentState);
      const currentGroup = this.calculateWhichGroup();
      if (currentGroup) {
        const hasWidget = this.widgets.filter(
          item => item.start === currentGroup.start
        );
        if (hasWidget.length)
          this.apiInputBox.removeLineWidget(hasWidget[0].widget);
        setTimeout(() => this.checkJsonParseError(), 450);
      }
    });

    this.apiInputBox.on('cursorActivity', () => {
      const currentGroup = this.calculateWhichGroup();
      this.highlightGroup(currentGroup);
    });

    this.apiOutputBox = CodeMirror.fromTextArea(
      this.$document[0].getElementById('api_output'),
      {
        lineNumbers: true,
        matchBrackets: true,
        mode: { name: 'javascript', json: true },
        readOnly: true,
        lineWrapping: true,
        styleActiveLine: true,
        theme: 'ttcn',
        foldGutter: true,
        gutters: ['CodeMirror-foldgutter']
      }
    );

    this.$scope.send = firstTime => this.send(firstTime);

    this.$scope.help = () => {
      this.$window.open(
        'https://documentation.wazuh.com/current/user-manual/api/reference.html'
      );
    };

    this.init();
    this.$scope.send(true);
  }

  analyzeGroups() {
    try {
      const currentState = this.apiInputBox.getValue().toString();
      this.appState.setCurrentDevTools(currentState);

      const tmpgroups = [];
      const splitted = currentState
        .split(/[\r\n]+(?=(?:GET|PUT|POST|DELETE)\b)/gm)
        .filter(item => item.replace(/\s/g, '').length);
      let start = 0;
      let end = 0;

      const slen = splitted.length;
      for (let i = 0; i < slen; i++) {
        let tmp = splitted[i].split('\n');
        if (Array.isArray(tmp)) tmp = tmp.filter(item => !item.includes('#'));
        const cursor = this.apiInputBox.getSearchCursor(splitted[i], null, {
          multiline: true
        });

        if (cursor.findNext()) start = cursor.from().line;
        else return [];

        end = start + tmp.length;

        const tmpRequestText = tmp[0];
        let tmpRequestTextJson = '';

        const tmplen = tmp.length;
        for (let j = 1; j < tmplen; ++j) {
          if (!!tmp[j] && !tmp[j].includes('#')) {
            tmpRequestTextJson += tmp[j];
          }
        }

        if (tmpRequestTextJson && typeof tmpRequestTextJson === 'string') {
          let rtjlen = tmp.length;
          while (rtjlen--) {
            if (tmp[rtjlen].trim() === '}') break;
            else end -= 1;
          }
        }

        if (!tmpRequestTextJson && tmp.length > 1) {
          tmp = [tmp[0]];
          end = start + 1;
        }

        if (i === slen - 1 && !tmpRequestTextJson) {
          if (tmp.length > 1) end -= tmp.length - 1;
        }

        end--;

        tmpgroups.push({
          requestText: tmpRequestText,
          requestTextJson: tmpRequestTextJson,
          start,
          end
        });
      }

      return tmpgroups;
    } catch (error) {
      return [];
    }
  }

  highlightGroup(group) {
    for (const line of this.linesWithClass) {
      this.apiInputBox.removeLineClass(
        line,
        'background',
        'CodeMirror-styled-background'
      );
    }
    this.linesWithClass = [];
    if (group) {
      if (!group.requestTextJson) {
        this.linesWithClass.push(
          this.apiInputBox.addLineClass(
            group.start,
            'background',
            'CodeMirror-styled-background'
          )
        );
        return;
      }
      for (let i = group.start; i <= group.end; i++) {
        this.linesWithClass.push(
          this.apiInputBox.addLineClass(
            i,
            'background',
            'CodeMirror-styled-background'
          )
        );
      }
    }
  }

  checkJsonParseError() {
    const affectedGroups = [];
    for (const widget of this.widgets) {
      this.apiInputBox.removeLineWidget(widget.widget);
    }
    this.widgets = [];
    for (const item of this.groups) {
      if (item.requestTextJson) {
        try {
          jsonLint.parse(item.requestTextJson);
        } catch (error) {
          affectedGroups.push(item.requestText);
          const msg = this.$document[0].createElement('div');
          msg.id = new Date().getTime() / 1000;
          const icon = msg.appendChild(this.$document[0].createElement('div'));

          icon.className = 'lint-error-icon';
          icon.id = new Date().getTime() / 1000;
          icon.onmouseover = () => {
            const advice = msg.appendChild(
              this.$document[0].createElement('span')
            );
            advice.id = new Date().getTime() / 1000;
            advice.innerText = error.message || 'Error parsing query';
            advice.className = 'lint-block-wz';
          };

          icon.onmouseleave = () => {
            msg.removeChild(msg.lastChild);
          };

          this.widgets.push({
            start: item.start,
            widget: this.apiInputBox.addLineWidget(item.start, msg, {
              coverGutter: false,
              noHScroll: true
            })
          });
        }
      }
    }
    return affectedGroups;
  }

  init() {
    this.apiInputBox.setSize('auto', '100%');
    var ExcludedIntelliSenseTriggerKeys = {
      "9": "tab", "13": "enter", "16": "shift", "17": "ctrl", "18": "alt", "19": "pause", "20": "capslock",
      "27": "escape", "33": "pageup", "34": "pagedown", "35": "end", "36": "home", "37": "left", "38": "up",
      "39": "right", "40": "down", "45": "insert", "91": "left window key", "92": "right window key", "93": "select",
      "112": "f1", "113": "f2", "114": "f3", "115": "f4", "116": "f5", "117": "f6", "118": "f7", "119": "f8",
      "120": "f9", "121": "f10", "122": "f11", "123": "f12", "144": "numlock", "145": "scrolllock"
    };
    this.apiInputBox.on("keyup", function (cm, e) {
      if (!ExcludedIntelliSenseTriggerKeys[(e.keyCode || e.which).toString()]) {
        cm.execCommand("autocomplete", null, {
          completeSingle: false
        });
      }
    });
    this.apiOutputBox.setSize('auto', '100%');
    const currentState = this.appState.getCurrentDevTools();
    if (!currentState) {
      const demoStr =
        'GET /\n\n# Comment here\nGET /agents\n' +
        JSON.stringify({ limit: 1 }, null, 2);
      this.appState.setCurrentDevTools(demoStr);
      this.apiInputBox.getDoc().setValue(demoStr);
    } else {
      this.apiInputBox.getDoc().setValue(currentState);
    }
    this.groups = this.analyzeGroups();
    const currentGroup = this.calculateWhichGroup();
    this.highlightGroup(currentGroup);

    // Register our custom Codemirror hint plugin.
    CodeMirror.registerHelper('hint', 'dictionaryHint', function (editor) {
       var model = [{"method":"GET","endpoints":[{"name":"/agents","args":[]},{"name":"/agents/:agent_id","args":[{"name":":agent_id"}]},{"name":"/agents/:agent_id/config/:component/:configuration","args":[{"name":":agent_id"},{"name":":component"},{"name":":configuration"}]},{"name":"/agents/:agent_id/group/is_sync","args":[{"name":":agent_id"}]},{"name":"/agents/:agent_id/key","args":[{"name":":agent_id"}]},{"name":"/agents/:agent_id/upgrade_result","args":[{"name":":agent_id"}]},{"name":"/agents/groups","args":[]},{"name":"/agents/groups/:group_id","args":[{"name":":group_id"}]},{"name":"/agents/groups/:group_id/configuration","args":[{"name":":group_id"}]},{"name":"/agents/groups/:group_id/files","args":[{"name":":group_id"}]},{"name":"/agents/groups/:group_id/files/:filename","args":[{"name":":group_id"},{"name":":filename"}]},{"name":"/agents/name/:agent_name","args":[{"name":":agent_name"}]},{"name":"/agents/no_group","args":[]},{"name":"/agents/outdated","args":[]},{"name":"/agents/stats/distinct","args":[]},{"name":"/agents/summary","args":[]},{"name":"/agents/summary/os","args":[]},{"name":"/cache","args":[]},{"name":"/cache/config","args":[]},{"name":"/ciscat/:agent_id/results","args":[{"name":":agent_id"}]},{"name":"/cluster/:node_id/configuration","args":[{"name":":node_id"}]},{"name":"/cluster/:node_id/info","args":[{"name":":node_id"}]},{"name":"/cluster/:node_id/logs","args":[{"name":":node_id"}]},{"name":"/cluster/:node_id/logs/summary","args":[{"name":":node_id"}]},{"name":"/cluster/:node_id/stats","args":[{"name":":node_id"}]},{"name":"/cluster/:node_id/stats/hourly","args":[{"name":":node_id"}]},{"name":"/cluster/:node_id/stats/weekly","args":[{"name":":node_id"}]},{"name":"/cluster/:node_id/status","args":[{"name":":node_id"}]},{"name":"/cluster/config","args":[]},{"name":"/cluster/healthcheck","args":[]},{"name":"/cluster/node","args":[]},{"name":"/cluster/nodes","args":[]},{"name":"/cluster/nodes/:node_name","args":[{"name":":node_name"}]},{"name":"/cluster/status","args":[]},{"name":"/decoders","args":[]},{"name":"/decoders/:decoder_name","args":[{"name":":decoder_name"}]},{"name":"/decoders/files","args":[]},{"name":"/decoders/parents","args":[]},{"name":"/experimental/ciscat/results","args":[]},{"name":"/experimental/syscollector/hardware","args":[]},{"name":"/experimental/syscollector/netaddr","args":[]},{"name":"/experimental/syscollector/netiface","args":[]},{"name":"/experimental/syscollector/netproto","args":[]},{"name":"/experimental/syscollector/os","args":[]},{"name":"/experimental/syscollector/packages","args":[]},{"name":"/experimental/syscollector/ports","args":[]},{"name":"/experimental/syscollector/processes","args":[]},{"name":"/manager/configuration","args":[]},{"name":"/manager/info","args":[]},{"name":"/manager/logs","args":[]},{"name":"/manager/logs/summary","args":[]},{"name":"/manager/stats","args":[]},{"name":"/manager/stats/analysisd","args":[]},{"name":"/manager/stats/hourly","args":[]},{"name":"/manager/stats/remoted","args":[]},{"name":"/manager/stats/weekly","args":[]},{"name":"/manager/status","args":[]},{"name":"/rootcheck/:agent_id","args":[{"name":":agent_id"}]},{"name":"/rootcheck/:agent_id/cis","args":[{"name":":agent_id"}]},{"name":"/rootcheck/:agent_id/last_scan","args":[{"name":":agent_id"}]},{"name":"/rootcheck/:agent_id/pci","args":[{"name":":agent_id"}]},{"name":"/rules","args":[]},{"name":"/rules/:rule_id","args":[{"name":":rule_id"}]},{"name":"/rules/files","args":[]},{"name":"/rules/gdpr","args":[]},{"name":"/rules/groups","args":[]},{"name":"/rules/pci","args":[]},{"name":"/syscheck/:agent_id","args":[{"name":":agent_id"}]},{"name":"/syscheck/:agent_id/last_scan","args":[{"name":":agent_id"}]},{"name":"/syscollector/:agent_id/hardware","args":[{"name":":agent_id"}]},{"name":"/syscollector/:agent_id/netaddr","args":[{"name":":agent_id"}]},{"name":"/syscollector/:agent_id/netiface","args":[{"name":":agent_id"}]},{"name":"/syscollector/:agent_id/netproto","args":[{"name":":agent_id"}]},{"name":"/syscollector/:agent_id/os","args":[{"name":":agent_id"}]},{"name":"/syscollector/:agent_id/packages","args":[{"name":":agent_id"}]},{"name":"/syscollector/:agent_id/ports","args":[{"name":":agent_id"}]},{"name":"/syscollector/:agent_id/processes","args":[{"name":":agent_id"}]}]}];

      function getDictionary(line, word) {
        var hints = {};
        var exp = line.split(/\s+/g);
        if (exp[0] && exp[0].match(/^(?:GET|PUT|POST|DELETE).*$/)) {
          var method = model.find(function (item) {
            return item.method == exp[0]
          });
          if (method) {
            method.endpoints.forEach(function (endpoint) {
              endpoint.path = endpoint.name;
              if (endpoint.args && endpoint.args.length > 0) {
                var argSubs = [];
                endpoint.args.forEach(function (arg) {
                  var pathSplitted = endpoint.name.split("/");
                  var arrayIdx = pathSplitted.indexOf(arg.name);
                  var wordSplitted = word.split("/");
                  if (wordSplitted[arrayIdx] && wordSplitted[arrayIdx] != '') {
                    argSubs.push({
                      "id": arg.name,
                      "value": wordSplitted[arrayIdx]
                    });
                  }
                });
                var auxPath = endpoint.name;
                argSubs.forEach(function (arg) {
                  auxPath = auxPath.replace(arg.id, arg.value);
                });
                endpoint.path = auxPath;
              }
            });
            hints = method.endpoints.map(a => a.path);
          } else {
            hints = [];
          }
          if (exp[2]) {
            hints = [];
          }
        } else {
          hints = model.map(a => a.method);
        }
        return hints.map(a => a);
      }

      var cur = editor.getCursor();
      var curLine = editor.getLine(cur.line);
      var start = cur.ch;
      var end = start;
      while (end < curLine.length && !/\s/.test(curLine.charAt(end)))++end;
      while (start && !/\s/.test(curLine.charAt(start - 1)))--start;
      var curWord = start !== end && curLine.slice(start, end);
      //var regex = new RegExp(curWord, 'i');
      return {
        list: (!curWord ? [] : getDictionary(curLine, curWord).filter(function (item) {
          return item.toUpperCase().includes(curWord.toUpperCase());
          //return item.match(regex);
        })).sort(),
        from: CodeMirror.Pos(cur.line, start),
        to: CodeMirror.Pos(cur.line, end)
      }
    });
  }

  calculateWhichGroup(firstTime) {
    try {
      const selection = this.apiInputBox.getCursor();

      const desiredGroup = firstTime
        ? this.groups.filter(item => item.requestText)
        : this.groups.filter(
          item =>
            item.requestText &&
            (item.end >= selection.line && item.start <= selection.line)
        );

      // Place play button at first line from the selected group
      const cords = this.apiInputBox.cursorCoords({
        line: desiredGroup[0].start,
        ch: 0
      });
      if (!$('#play_button').is(':visible')) $('#play_button').show();
      const currentPlayButton = $('#play_button').offset();
      $('#play_button').offset({
        top: cords.top,
        left: currentPlayButton.left
      });
      if (firstTime) this.highlightGroup(desiredGroup[0]);
      return desiredGroup[0];
    } catch (error) {
      $('#play_button').hide();
      return null;
    }
  }

  async send(firstTime) {
    try {
      this.groups = this.analyzeGroups();

      const desiredGroup = this.calculateWhichGroup(firstTime);

      if (desiredGroup) {
        if (firstTime) {
          const cords = this.apiInputBox.cursorCoords({
            line: desiredGroup.start,
            ch: 0
          });
          const currentPlayButton = $('#play_button').offset();
          $('#play_button').offset({
            top: cords.top + 10,
            left: currentPlayButton.left
          });
        }

        const affectedGroups = this.checkJsonParseError();
        const filteredAffectedGroups = affectedGroups.filter(
          item => item === desiredGroup.requestText
        );
        if (filteredAffectedGroups.length) {
          this.apiOutputBox.setValue('Error parsing JSON query');
          return;
        }

        const method = desiredGroup.requestText.startsWith('GET')
          ? 'GET'
          : desiredGroup.requestText.startsWith('POST')
            ? 'POST'
            : desiredGroup.requestText.startsWith('PUT')
              ? 'PUT'
              : desiredGroup.requestText.startsWith('DELETE')
                ? 'DELETE'
                : 'GET';

        const requestCopy = desiredGroup.requestText.includes(method)
          ? desiredGroup.requestText.split(method)[1].trim()
          : desiredGroup.requestText;

        // Checks for inline parameters
        const inlineSplit = requestCopy.split('?');

        const extra =
          inlineSplit && inlineSplit[1]
            ? queryString.parse(inlineSplit[1])
            : {};

        const req = requestCopy
          ? requestCopy.startsWith('/')
            ? requestCopy
            : `/${requestCopy}`
          : '/';

        let JSONraw = {};
        try {
          JSONraw = JSON.parse(desiredGroup.requestTextJson);
        } catch (error) {
          JSONraw = {};
        }

        if (typeof extra.pretty !== 'undefined') delete extra.pretty;
        if (typeof JSONraw.pretty !== 'undefined') delete JSONraw.pretty;

        // Assign inline parameters
        for (const key in extra) JSONraw[key] = extra[key];

        const path = req.includes('?') ? req.split('?')[0] : req;

        if (typeof JSONraw === 'object') JSONraw.devTools = true;
        const output = await this.apiReq.request(method, path, JSONraw);

        this.apiOutputBox.setValue(JSON.stringify(output.data.data, null, 2));
      } else {
        this.apiOutputBox.setValue('Welcome!');
      }
    } catch (error) {
      const parsedError = this.errorHandler.handle(error, null, null, true);
      if (typeof parsedError === 'string') {
        return this.apiOutputBox.setValue(parsedError);
      } else if (error && error.data && typeof error.data === 'object') {
        return this.apiOutputBox.setValue(JSON.stringify(error.data));
      } else {
        return this.apiOutputBox.setValue('Empty');
      }
    }
  }
}

// Logs controller
app.controller('devToolsController', DevToolsController);
