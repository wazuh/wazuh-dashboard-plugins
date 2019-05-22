/*
 * Wazuh app - Dev tools controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import CodeMirror from '../../utils/codemirror/lib/codemirror';
import jsonLint from '../../utils/codemirror/json-lint';
import { ExcludedIntelliSenseTriggerKeys } from '../../../util/excluded-devtools-autocomplete-keys';
import queryString from 'querystring-browser';
import $ from 'jquery';
import * as FileSaver from '../../services/file-saver';
export class DevToolsController {
  /**
   * Constructor
   * @param {*} $scope
   * @param {*} apiReq
   * @param {*} genericReq
   * @param {*} $window
   * @param {*} appState
   * @param {*} errorHandler
   * @param {*} $document
   */
  constructor(
    $scope,
    apiReq,
    genericReq,
    $window,
    appState,
    errorHandler,
    $document
  ) {
    this.apiReq = apiReq;
    this.genericReq = genericReq;
    this.$window = $window;
    this.appState = appState;
    this.errorHandler = errorHandler;
    this.$document = $document;
    this.groups = [];
    this.linesWithClass = [];
    this.widgets = [];
    this.multipleKeyPressed = [];
  }

  /**
   * When controller loads
   */
  $onInit() {
    $(this.$document[0]).keydown(e => {
      if (!this.multipleKeyPressed.includes(e.which)) {
        this.multipleKeyPressed.push(e.which);
      }
      if (
        this.multipleKeyPressed.includes(13) &&
        this.multipleKeyPressed.includes(16) &&
        this.multipleKeyPressed.length === 2
      ) {
        e.preventDefault();
        return this.send();
      }
    });

    // eslint-disable-next-line
    $(this.$document[0]).keyup(e => {
      this.multipleKeyPressed = [];
    });

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
    // Register plugin for code mirror
    CodeMirror.commands.autocomplete = function(cm) {
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
        setTimeout(() => this.checkJsonParseError(), 150);
      }
    });

    this.apiInputBox.on('cursorActivity', () => {
      const currentGroup = this.calculateWhichGroup();
      this.highlightGroup(currentGroup);
      this.checkJsonParseError();
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

    this.init();
    this.send(true);
  }

  /**
   * Open API reference documentation
   */
  help() {
    this.$window.open(
      'https://documentation.wazuh.com/current/user-manual/api/reference.html'
    );
  }

  /**
   * Detect de groups of instructions
   */
  analyzeGroups() {
    try {
      const currentState = this.apiInputBox.getValue().toString();
      this.appState.setCurrentDevTools(currentState);

      const tmpgroups = [];
      const splitted = currentState
        .split(/[\r\n]+(?=(?:GET|PUT|POST|DELETE|#)\b)/gm)
        .filter(item => item.replace(/\s/g, '').length);

      let start = 0;
      let end = 0;
      let starts = [];
      const slen = splitted.length;
      for (let i = 0; i < slen; i++) {
        let tmp = splitted[i].split('\n');
        if (Array.isArray(tmp)) tmp = tmp.filter(item => !item.includes('#'));
        const cursor = this.apiInputBox.getSearchCursor(splitted[i], null, {
          multiline: true
        });

        if (cursor.findNext()) start = cursor.from().line;
        else return [];

        /**
         * Prevents from user frustation when there are duplicated queries.
         * We want to look for the next query when available, even if it
         * already exists but it's not the selected query.
         */
        if (tmp.length) {
          // It's a safe loop since findNext method returns null if there is no next query.
          while (
            this.apiInputBox.getLine(cursor.from().line) !== tmp[0] &&
            cursor.findNext()
          ) {
            start = cursor.from().line;
          }
          // It's a safe loop since findNext method returns null if there is no next query.
          while (starts.includes(start) && cursor.findNext()) {
            start = cursor.from().line;
          }
        }
        starts.push(start);

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
      starts = [];
      return tmpgroups;
    } catch (error) {
      return [];
    }
  }

  /**
   * This seta group as active, and highlight it
   * @param {Object} group
   */
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
      if (
        !group.requestTextJson ||
        (group.requestText.includes('{') && group.requestText.includes('}'))
      ) {
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

  /**
   * This validate fromat of JSON group
   */
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

  /**
   * This loads all available paths of the API to show them in the autocomplete
   */
  async getAvailableMethods() {
    try {
      const response = await this.genericReq.request('GET', '/api/routes', {});
      this.apiInputBox.model = !response.error ? response.data : [];
    } catch (error) {
      this.apiInputBox.model = [];
    }
  }

  getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;

    while (element) {
      xPosition += element.offsetLeft - element.scrollLeft + element.clientLeft;
      yPosition += element.offsetTop - element.scrollTop + element.clientTop;
      element = element.offsetParent;
    }

    return { x: xPosition, y: yPosition };
  }

  /**
   * This set some required settings at init
   */
  init() {
    this.apiInputBox.setSize('auto', '100%');
    this.apiInputBox.model = [];
    this.getAvailableMethods();
    this.apiInputBox.on('keyup', function(cm, e) {
      if (!ExcludedIntelliSenseTriggerKeys[(e.keyCode || e.which).toString()]) {
        cm.execCommand('autocomplete', null, {
          completeSingle: false
        });
      }
    });
    this.apiOutputBox.setSize('auto', '100%');
    const currentState = this.appState.getCurrentDevTools();
    if (!currentState) {
      const demoStr =
        'GET /agents?status=Active\n\n#Example comment\nGET /manager/info\n\nGET /syscollector/000/packages?search=ssh\n' +
        JSON.stringify({ limit: 5 }, null, 2);

      this.appState.setCurrentDevTools(demoStr);
      this.apiInputBox.getDoc().setValue(demoStr);
    } else {
      this.apiInputBox.getDoc().setValue(currentState);
    }
    this.groups = this.analyzeGroups();
    const currentGroup = this.calculateWhichGroup();
    this.highlightGroup(currentGroup);

    // Register our custom Codemirror hint plugin.
    CodeMirror.registerHelper('hint', 'dictionaryHint', function(editor) {
      const model = editor.model;
      function getDictionary(line, word) {
        let hints = [];
        const exp = line.split(/\s+/g);
        if (exp[0] && exp[0].match(/^(?:GET|PUT|POST|DELETE).*$/)) {
          let method = model.find(function(item) {
            return item.method === exp[0];
          });
          const forbidChars = /^[^?{]+$/;
          if (method && !exp[2] && forbidChars.test(word)) {
            method.endpoints.forEach(function(endpoint) {
              endpoint.path = endpoint.name;
              if (endpoint.args && endpoint.args.length > 0) {
                let argSubs = [];
                endpoint.args.forEach(function(arg) {
                  const pathSplitted = endpoint.name.split('/');
                  const arrayIdx = pathSplitted.indexOf(arg.name);
                  const wordSplitted = word.split('/');
                  if (wordSplitted[arrayIdx] && wordSplitted[arrayIdx] != '') {
                    argSubs.push({
                      id: arg.name,
                      value: wordSplitted[arrayIdx]
                    });
                  }
                });
                let auxPath = endpoint.name;
                argSubs.forEach(function(arg) {
                  auxPath = auxPath.replace(arg.id, arg.value);
                });
                endpoint.path = auxPath;
              }
            });
            hints = method.endpoints.map(a => a.path);
          }
        } else {
          hints = model.map(a => a.method);
        }
        return hints;
      }

      const cur = editor.getCursor();
      const curLine = editor.getLine(cur.line);
      let start = cur.ch;
      let end = start;
      const whiteSpace = /\s/;
      while (end < curLine.length && !whiteSpace.test(curLine.charAt(end)))
        ++end;
      while (start && !whiteSpace.test(curLine.charAt(start - 1))) --start;
      const curWord = start !== end && curLine.slice(start, end);
      return {
        list: (!curWord
          ? []
          : getDictionary(curLine, curWord).filter(function(item) {
              return item.toUpperCase().includes(curWord.toUpperCase());
            })
        ).sort(),
        from: CodeMirror.Pos(cur.line, start),
        to: CodeMirror.Pos(cur.line, end)
      };
    });
    const evtDocument = this.$document[0];
    $('.wz-dev-column-separator').mousedown(function(e) {
      e.preventDefault();
      $('.wz-dev-column-separator').addClass('active');
      const leftOrigWidth = $('#wz-dev-left-column').width();
      const rightOrigWidth = $('#wz-dev-right-column').width();
      $(evtDocument).mousemove(function(e) {
        const leftWidth = e.pageX - 85 + 14;
        let rightWidth = leftOrigWidth - leftWidth;
        $('#wz-dev-left-column').css('width', leftWidth);
        $('#wz-dev-right-column').css('width', rightOrigWidth + rightWidth);
      });
    });

    $(evtDocument).mouseup(function() {
      $('.wz-dev-column-separator').removeClass('active');
      $(evtDocument).unbind('mousemove');
    });

    this.$window.onresize = () => {
      $('#wz-dev-left-column').attr(
        'style',
        'width: calc(30% - 7px); !important'
      );
      $('#wz-dev-right-column').attr(
        'style',
        'width: calc(70% - 7px); !important'
      );
      dynamicHeight();
    };

    const dynamicHeight = () => {
      const self = this;
      const window = this.$window;
      setTimeout(function() {
        const windows = $(window).height();
        $('#wz-dev-left-column').height(
          windows - (self.getPosition($('#wz-dev-left-column')[0]).y + 20)
        );
        $('.wz-dev-column-separator').height(
          windows - (self.getPosition($('.wz-dev-column-separator')[0]).y + 20)
        );
        $('#wz-dev-right-column').height(
          windows - (self.getPosition($('#wz-dev-right-column')[0]).y + 20)
        );
        $('.wz-dev-column-separator span').height(
          windows -
            (self.getPosition($('.wz-dev-column-separator span')[0]).y + 20)
        );
      }, 1);
    };
    dynamicHeight();
  }

  /**
   * This method highlights one of the groups the first time
   * @param {Boolean} firstTime
   */
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

  /**
   * This perfoms the typed request to API
   * @param {Boolean} firstTime
   */
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

        let requestCopy = desiredGroup.requestText.includes(method)
          ? desiredGroup.requestText.split(method)[1].trim()
          : desiredGroup.requestText;

        // Checks for inline parameters
        let paramsInline = false;
        if (requestCopy.includes('{') && requestCopy.includes('}')) {
          paramsInline = `{${requestCopy.split('{')[1]}`;
          requestCopy = requestCopy.split('{')[0];
        }
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
          JSONraw = JSON.parse(paramsInline || desiredGroup.requestTextJson);
        } catch (error) {
          JSONraw = {};
        }

        if (typeof extra.pretty !== 'undefined') delete extra.pretty;
        if (typeof JSONraw.pretty !== 'undefined') delete JSONraw.pretty;

        let path = '';
        if (method === 'GET' || method === 'POST') {
          // Assign inline parameters
          for (const key in extra) JSONraw[key] = extra[key];
          path = req.includes('?') ? req.split('?')[0] : req;
        } else {
          path =
            typeof JSONraw === 'object' && Object.keys(JSONraw).length
              ? `${req}${req.includes('?') ? '&' : '?'}${queryString.unescape(
                  queryString.stringify(JSONraw)
                )}`
              : req;
          JSONraw = {};
        }

        if (typeof JSONraw === 'object') JSONraw.devTools = true;
        if (!firstTime) {
          const output = await this.apiReq.request(method, path, JSONraw);
          this.apiOutputBox.setValue(
            JSON.stringify((output || {}).data || {}, null, 2).replace(
              /\\\\/g,
              '\\'
            )
          );
        }
      }

      (firstTime || !desiredGroup) && this.apiOutputBox.setValue('Welcome!');
    } catch (error) {
      if ((error || {}).status === -1) {
        return this.apiOutputBox.setValue(
          'Wazuh API is not reachable. Reason: timeout.'
        );
      } else {
        const parsedError = this.errorHandler.handle(error, null, null, true);
        if (typeof parsedError === 'string') {
          return this.apiOutputBox.setValue(error);
        } else if (error && error.data && typeof error.data === 'object') {
          return this.apiOutputBox.setValue(JSON.stringify(error));
        } else {
          return this.apiOutputBox.setValue('Empty');
        }
      }
    }
  }

  exportOutput() {
    try {
      // eslint-disable-next-line
      const blob = new Blob([this.apiOutputBox.getValue()], {
        type: 'application/json'
      });
      FileSaver.saveAs(blob, 'export.json');
    } catch (error) {
      this.errorHandler.handle(error, 'Export JSON');
    }
  }
}
