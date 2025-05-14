import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '../../../utils/codemirror/lib/codemirror';
import jsonLint from '../../../utils/codemirror/json-lint';
import { ExcludedIntelliSenseTriggerKeys } from './excluded-devtools-autocomplete-keys';
import queryString from 'querystring-browser';
import $ from 'jquery';
import * as FileSaver from '../../../services/file-saver';
import { DynamicHeight } from '../../../utils/dynamic-height';
import {
  GenericRequest,
  WzRequest,
  AppState,
  ErrorHandler,
} from '../../../react-services';
import store from '../../../redux/store';
import { getUiSettings } from '../../../kibana-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { withGlobalBreadcrumb } from '../../common/hocs';
import { devTools } from '../../../utils/applications';

/**
 * Detect de groups of instructions
 */
function analyzeGroups(editor) {
  try {
    const currentState = editor.getValue().toString();
    AppState.setCurrentDevTools(currentState);
    const tmpgroups = [];
    const splitted = currentState
      .split(/[\r\n]+(?=(?:GET|PUT|POST|DELETE)\b)/gm)
      .filter(item => item.replace(/\s/g, '').length);

    let start = 0;
    let end = 0;
    let starts = [];
    const slen = splitted.length;
    for (let i = 0; i < slen; i++) {
      let tmp = splitted[i].split('\n');
      if (Array.isArray(tmp)) tmp = tmp.filter(item => !item.startsWith('#'));
      const cursor = editor.getSearchCursor(splitted[i], null, {
        multiline: true,
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
          editor.getLine(cursor.from().line) !== tmp[0] &&
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
        if (!!tmp[j] && !tmp[j].startsWith('#')) {
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
        end,
      });
    }
    starts = [];
    return tmpgroups;
  } catch (error) {
    const options: UIErrorLog = {
      context: `analyzeGroups`,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      error: {
        error: error,
        message: error.message || error,
        title: error.name || error,
      },
    };
    getErrorOrchestrator().handleError(options);
    return [];
  }
}

/**
 * This method highlights one of the groups the first time
 */
function calculateWhichGroup(editor, firstTime = false, groups = []) {
  try {
    const selection = editor.getCursor();
    const desiredGroup = firstTime
      ? groups.filter(item => item.requestText)
      : groups.filter(
          item =>
            item.requestText &&
            item.end >= selection.line &&
            item.start <= selection.line,
        );

    // Place play button at first line from the selected group
    let cords;
    try {
      cords = editor.cursorCoords({
        line: desiredGroup[0].start,
        ch: 0,
      });
    } catch {
      $('#play_button').hide();
      $('#wazuh_dev_tools_documentation').hide();
      return null;
    }

    if (!$('#play_button').is(':visible')) $('#play_button').show();
    if (!$('#wazuh_dev_tools_documentation').is(':visible'))
      $('#wazuh_dev_tools_documentation').show();
    const currentPlayButton = $('#play_button').offset();
    $('#play_button').offset({
      top: cords.top /*+ 2*/,
      left: currentPlayButton.left,
    });
    $('#wazuh_dev_tools_documentation').offset({
      top: cords.top /*+ 2*/,
    });
    if (firstTime) highlightGroup(editor, desiredGroup[0]);
    if (desiredGroup[0]) {
      const [
        inputRequest,
        inputHttpMethod,
        inputPath,
        inputQueryParamsStart,
        inputQueryParams,
      ] =
        (desiredGroup[0] &&
          desiredGroup[0].requestText &&
          desiredGroup[0].requestText.match(
            /^(GET|PUT|POST|DELETE) ([^\?]*)(\?)?(\S+)?/,
          )) ||
        [];
      // Split the input request path as array and lowercase
      const inputEndpoint =
        (inputPath &&
          inputPath
            .split('/')
            .filter(item => item)
            .map(item => item.toLowerCase())) ||
        [];
      // Get all API endpoints with http method in the request
      const inputHttpMethodEndpoints =
        (editor.model.find(item => item.method === inputHttpMethod) || {})
          .endpoints || [];
      // Find the API endpoint in the request
      const apiEndpoint = inputHttpMethodEndpoints
        .map(endpoint => ({
          ...endpoint,
          splitURL: endpoint.name.split('/').filter(item => item),
        }))
        .filter(endpoint => endpoint.splitURL.length === inputEndpoint.length)
        .find(endpoint =>
          endpoint.splitURL.reduce(
            (accum, str, index) =>
              accum &&
              (str.startsWith(':')
                ? true
                : str.toLowerCase() === inputEndpoint[index]),
            true,
          ),
        );
      if (apiEndpoint && apiEndpoint.documentation) {
        $('#wazuh_dev_tools_documentation')
          .attr('href', apiEndpoint.documentation)
          .show();
      } else {
        $('#wazuh_dev_tools_documentation').attr('href', '').hide();
      }
    }
    return desiredGroup[0];
  } catch (error) {
    $('#play_button').hide();
    $('#wazuh_dev_tools_documentation').hide();
    const options: UIErrorLog = {
      context: `calculateWhichGroup`,
      level: UI_LOGGER_LEVELS.WARNING as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      error: {
        error: error,
        message: error.message || error,
        title: error.name,
      },
    };
    getErrorOrchestrator().handleError(options);

    return null;
  }
}

/**
 * This seta group as active, and highlight it
 */
function highlightGroup(editor, group) {
  editor.eachLine(line =>
    editor.removeLineClass(line, 'background', 'CodeMirror-styled-background'),
  );
  if (group) {
    if (
      !group.requestTextJson ||
      (group.requestText.includes('{') && group.requestText.includes('}'))
    ) {
      editor.addLineClass(
        group.start,
        'background',
        'CodeMirror-styled-background',
      );
      return;
    }
    for (let i = group.start; i <= group.end; i++) {
      editor.addLineClass(i, 'background', 'CodeMirror-styled-background');
    }
  }
}

/**
 * This validate format of JSON group
 */
function checkJsonParseError(editor, groups = []) {
  const affectedGroups = [];
  for (const widget of editor.__widgets) {
    editor.removeLineWidget(widget.widget);
  }
  editor.__widgets = [];
  for (const item of groups) {
    if (item.requestTextJson) {
      try {
        jsonLint.parse(item.requestTextJson);
      } catch (error) {
        affectedGroups.push(item.requestText);
        const msg = window.document.createElement('div');
        msg.id = new Date().getTime() / 1000;
        const icon = msg.appendChild(window.document.createElement('div'));

        icon.className = 'lint-error-icon';
        icon.id = new Date().getTime() / 1000;
        icon.onmouseover = () => {
          const advice = msg.appendChild(window.document.createElement('span'));
          advice.id = new Date().getTime() / 1000;
          advice.innerText = error.message || 'Error parsing query';
          advice.className = 'lint-block-wz';
        };

        icon.onmouseleave = () => {
          msg.removeChild(msg.lastChild);
        };

        editor.__widgets.push({
          start: item.start,
          widget: editor.addLineWidget(item.start, msg, {
            coverGutter: false,
            noHScroll: true,
          }),
        });
      }
    }
  }
  return affectedGroups;
}

/**
 * This set some required settings at init
 */
function init(editorInput, editorOutput) {
  editorInput.setSize('auto', '100%');
  editorInput.on('keyup', function (cm, e) {
    if (!ExcludedIntelliSenseTriggerKeys[(e.keyCode || e.which).toString()]) {
      cm.execCommand('autocomplete', null, {
        completeSingle: false,
      });
    }
  });
  editorOutput.setSize('auto', '100%');
  const currentState = AppState.getCurrentDevTools();
  if (!currentState) {
    const demoStr =
      'GET /agents?status=active\n\n# Example comment\n\n# You can use ? after the endpoint \n# in order to get suggestions \n# for your query params\n\nGET /manager/info\n\nPOST /agents\n' +
      JSON.stringify({ name: 'NewAgent' }, null, 2) +
      '\n\nPUT /logtest\n' +
      JSON.stringify(
        {
          log_format: 'syslog',
          location: 'logtest',
          event:
            'Jul 06 22:00:22 linux-agent sshd[29205]: Invalid user blimey from 1.3.1.3 port 48928',
        },
        null,
        2,
      );

    AppState.setCurrentDevTools(demoStr);
    editorInput.getDoc().setValue(demoStr);
  } else {
    editorInput.getDoc().setValue(currentState);
  }
  const groups = analyzeGroups(editorInput);
  const currentGroup = calculateWhichGroup(editorInput, undefined, groups);
  highlightGroup(editorInput, currentGroup);
  // Register our custom Codemirror hint plugin.
  CodeMirror.registerHelper('hint', 'dictionaryHint', function (editor) {
    const model = editorInput.model;
    function getDictionary(line, word) {
      let hints = [];
      const exp = line.split(/\s+/g);
      const groups = analyzeGroups(editorInput);
      const currentGroup = calculateWhichGroup(editor, undefined, groups);
      const editorCursor = editor.getCursor();
      // Get http method, path, query params from API request
      const [
        inputRequest,
        inputHttpMethod,
        inputPath,
        inputQueryParamsStart,
        inputQueryParams,
      ] =
        (currentGroup &&
          currentGroup.requestText &&
          currentGroup.requestText.match(
            /^(GET|PUT|POST|DELETE) ([^\?]*)(\?)?(\S+)?/,
          )) ||
        [];
      // Split the input request path as array and lowercase
      const inputEndpoint =
        (inputPath &&
          inputPath
            .split('/')
            .filter(item => item)
            .map(item => item.toLowerCase())) ||
        [];
      // Get all API endpoints with http method in the request
      const inputHttpMethodEndpoints =
        (model.find(item => item.method === inputHttpMethod) || {}).endpoints ||
        [];
      // Find the API endpoint in the request
      const apiEndpoint = inputHttpMethodEndpoints
        .map(endpoint => ({
          ...endpoint,
          splitURL: endpoint.name.split('/').filter(item => item),
        }))
        .filter(endpoint => endpoint.splitURL.length === inputEndpoint.length)
        .find(endpoint =>
          endpoint.splitURL.reduce(
            (accum, str, index) =>
              accum &&
              (str.startsWith(':')
                ? true
                : str.toLowerCase() === inputEndpoint[index]),
            true,
          ),
        );
      // Get API endpoint path hints
      if (
        exp[0] &&
        currentGroup &&
        currentGroup.start === editorCursor.line &&
        !word.includes('{')
      ) {
        // Get hints for requests as: http_method api_path?query_params
        if (inputHttpMethod && inputPath && inputQueryParamsStart) {
          // Split the query params as {key, value}[] where key=value in query param
          const inputQuery =
            (inputQueryParams &&
              inputQueryParams
                .split('&')
                .filter(item => item)
                .map(item => {
                  const [key, value] = item.split('=');
                  return { key, value };
                })) ||
            [];
          // It is defining query param value query_param=
          const definingQueryParamValue =
            inputQueryParams && inputQueryParams.includes('&')
              ? inputRequest.lastIndexOf('=') > inputRequest.lastIndexOf('&')
              : !!(inputQueryParams || '').includes('?') ||
                inputRequest.lastIndexOf('=') > inputRequest.lastIndexOf('?');

          if (!definingQueryParamValue && apiEndpoint && apiEndpoint.query) {
            const inputQueryPreviousEntriesKeys = inputQuery
              .filter(query => query.key && query.value)
              .map(query => query.key);
            hints = apiEndpoint.query
              .filter(
                query => !inputQueryPreviousEntriesKeys.includes(query.name),
              )
              .map(
                item =>
                  `${inputPath}${inputQuery
                    .filter(query => query.key && query.value)
                    .reduce(
                      (accum, query, index) =>
                        `${accum}${index > 0 ? '&' : ''}${query.key}=${
                          query.value
                        }`,
                      '?',
                    )}${
                    inputQuery.filter(query => query.key && query.value)
                      .length > 0
                      ? '&'
                      : ''
                  }${item.name}=`,
              );
          }
        } else if (inputHttpMethod) {
          // Get hints for all http method endpoint
          if (!inputPath) {
            hints = inputHttpMethodEndpoints.map(endpoint => endpoint.name);
          } else {
            // Get hints for requests as: http_method api_path
            hints = inputHttpMethodEndpoints
              .map(endpoint => ({
                ...endpoint,
                splitURL: endpoint.name.split('/').filter(item => item),
              }))
              .filter(endpoint =>
                endpoint.splitURL.reduce((accum, splitPath, index) => {
                  if (!accum) {
                    return accum;
                  }
                  if (
                    splitPath.startsWith(':') ||
                    !inputEndpoint[index] ||
                    (inputEndpoint[index] &&
                      splitPath.startsWith(inputEndpoint[index]))
                  ) {
                    return true;
                  }
                }, true),
              )
              .map(endpoint =>
                endpoint.splitURL.reduce(
                  (accum, splitPath, index) =>
                    `${accum}/${
                      (splitPath.startsWith(':') && inputEndpoint[index]) ||
                      splitPath
                    }`,
                  '',
                ),
              );
          }
        }
        // Get API endpoint body params hints
      } else if (
        currentGroup &&
        currentGroup.requestText &&
        currentGroup.requestTextJson &&
        currentGroup.start < editorCursor.line &&
        currentGroup.end > editorCursor.line
      ) {
        const reLineStart = /^(\s*)(?:"|')(\S*)(?::)?$/; // Line starts with
        const spaceLineStart = (line.match(reLineStart) || [])[1] || '';
        const inputKeyBodyParam = (line.match(reLineStart) || [])[2] || '';

        const renderBodyParam = (parameter, spaceLineStart) => {
          let valueBodyParam = '';
          if (parameter.type === 'string') {
            valueBodyParam = '""';
          } else if (parameter.type === 'array') {
            valueBodyParam = '[]';
          } else if (parameter.type === 'object') {
            const paramPropertiesKeys = Object.keys(
              parameter.properties,
            ).sort();
            const lastIndex = paramPropertiesKeys.length - 1;
            valueBodyParam = `{\n${paramPropertiesKeys
              .map(
                (keyProperty, index) =>
                  `${spaceLineStart}\t${renderBodyParam(
                    {
                      name: keyProperty,
                      ...parameter.properties[keyProperty],
                    },
                    spaceLineStart + '\t',
                  )}${lastIndex !== index ? ',' : ''}`,
              )
              .join('\n')}\n${spaceLineStart}}`;
          }
          return `"${parameter.name}": ${valueBodyParam}`;
        };

        const getInnerKeysBodyRequest = () => {
          let jsonBodyKeyCurrent = [];
          let jsonBodyKeyCurrentPosition = {
            start: { line: currentGroup.start, ch: 0 },
            end: { line: currentGroup.start, ch: 0 },
          };
          return [
            ...Array(currentGroup.end + 1 - currentGroup.start).keys(),
          ].reduce((jsonBodyKeyCursor, lineNumberRange) => {
            const editorLineNumber = currentGroup.start + lineNumberRange;
            const editorLineContent = editor.getLine(editorLineNumber);
            const openBracket = editorLineContent.indexOf('{');
            const closeBracket = editorLineContent.indexOf('}');
            const keyOpenBracket = (editorLineContent.match(
              /\s*"(\S+)"\s*:\s*\{/,
            ) || [])[1];
            keyOpenBracket &&
              jsonBodyKeyCurrent.push(keyOpenBracket) &&
              (jsonBodyKeyCurrentPosition.start = {
                line: editorLineNumber,
                ch: openBracket,
              });

            closeBracket !== -1 &&
              (jsonBodyKeyCurrentPosition.end = {
                line: editorLineNumber,
                ch: closeBracket,
              });
            if (
              !jsonBodyKeyCursor &&
              editorCursor.line > jsonBodyKeyCurrentPosition.start.line &&
              editorCursor.line < jsonBodyKeyCurrentPosition.end.line
            ) {
              jsonBodyKeyCursor = [...jsonBodyKeyCurrent];
            }
            closeBracket !== -1 && jsonBodyKeyCurrent.pop();
            return jsonBodyKeyCursor;
          }, false);
        };
        const getInnerPropertyBodyParamObject = (object, keys) => {
          if (!keys || !keys.length) {
            return object;
          }
          const key = keys.shift();
          if (
            !object.properties ||
            !object.properties[key] ||
            object.properties[key].type !== 'object'
          ) {
            return [];
          }
          return getInnerPropertyBodyParamObject(object.properties[key], keys);
        };

        if (apiEndpoint && apiEndpoint.body && reLineStart.test(line)) {
          let inputBodyPreviousKeys;
          let paramsBody = apiEndpoint.body;
          let requestBodyCursorKeys;
          if (apiEndpoint.body[0].type === 'object') {
            requestBodyCursorKeys = getInnerKeysBodyRequest();
            const paramInnerBody = getInnerPropertyBodyParamObject(
              apiEndpoint.body[0],
              [...requestBodyCursorKeys],
            );
            paramsBody = Object.keys(paramInnerBody.properties)
              .sort()
              .map(keyBodyParam => ({
                name: keyBodyParam,
                ...paramInnerBody.properties[keyBodyParam],
              }));
          }
          try {
            const bodySanitizedBodyParam = currentGroup.requestTextJson.replace(
              /(,?\s*"\S*\s*)\}/g,
              '}',
            );
            inputBodyPreviousKeys = Object.keys(
              (requestBodyCursorKeys || []).reduce(
                (acumm, key) => acumm[key],
                JSON.parse(bodySanitizedBodyParam),
              ),
            );
          } catch (error) {
            inputBodyPreviousKeys = [];
            const options: UIErrorLog = {
              context: `getDictionary`,
              level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
              severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
              error: {
                error: error,
                message: error.message || error,
                title: error.name,
              },
            };
            getErrorOrchestrator().handleError(options);
          }

          hints = paramsBody
            .filter(
              bodyParam =>
                !inputBodyPreviousKeys.includes(bodyParam.name) &&
                bodyParam.name &&
                (inputKeyBodyParam
                  ? bodyParam.name.includes(inputKeyBodyParam)
                  : true),
            )
            .map(bodyParam => ({
              text: renderBodyParam(bodyParam, spaceLineStart),
              _moveCursor: ['string', 'array'].includes(bodyParam.type),
              displayText: bodyParam.name,
              bodyParam,
              hint: (cm, self, data) => {
                editor.replaceRange(
                  line.replace(/\S+/, '') + data.text,
                  { line: editorCursor.line, ch: editorCursor.ch },
                  { line: editorCursor.line, ch: 0 },
                );
                const textReplacedLine = editor.getLine(editorCursor.line);
                editor.setCursor({
                  line: editorCursor.line,
                  ch: data._moveCursor
                    ? textReplacedLine.length - 1
                    : textReplacedLine.length,
                });
              },
            }));
        }
      } else {
        hints = model.map(a => a.method);
      }
      const final_hints = hints.map(chain => {
        /* This avoids the errors when the hint is not a string.
          The request body parameters is an object and the chain.replace
          statement causes an error
          */
        if (typeof chain !== 'string') {
          return chain;
        }
        let t = 0;
        return (chain = chain.replace(/\?/g, match => {
          t++;
          return t > 1 ? '' : match;
        }));
      });
      return final_hints;
    }

    const cur = editor.getCursor();
    const curLine = editor.getLine(cur.line);
    let start = cur.ch;
    let end = start;
    const whiteSpace = /\s/;
    while (end < curLine.length && !whiteSpace.test(curLine.charAt(end))) ++end;
    while (start && !whiteSpace.test(curLine.charAt(start - 1))) --start;
    const curWord = start !== end && curLine.slice(start, end);
    return {
      list: (!curWord
        ? []
        : getDictionary(curLine, curWord).filter(function (item) {
            const text = item.text || item;
            return text.toUpperCase().includes(curWord.toUpperCase());
          })
      ).sort(),
      from: CodeMirror.Pos(cur.line, start),
      to: CodeMirror.Pos(cur.line, end),
    };
  });
  const evtDocument = window.document;
  $('.wz-dev-column-separator').mousedown(function (e) {
    e.preventDefault();
    $('.wz-dev-column-separator').addClass('active');
    const leftOrigWidth = $('#wz-dev-left-column').width();
    const rightOrigWidth = $('#wz-dev-right-column').width();
    $(evtDocument).mousemove(function (e) {
      const leftWidth = e.pageX - 85 + 14;
      let rightWidth = leftOrigWidth - leftWidth;
      $('#wz-dev-left-column').css('width', leftWidth);
      $('#wz-dev-right-column').css('width', rightOrigWidth + rightWidth);
    });
  });

  $(evtDocument).mouseup(function () {
    $('.wz-dev-column-separator').removeClass('active');
    $(evtDocument).unbind('mousemove');
  });

  window.onresize = () => {
    $('#wz-dev-left-column').attr(
      'style',
      'width: calc(45% - 7px); !important',
    );
    $('#wz-dev-right-column').attr(
      'style',
      'width: calc(55% - 7px); !important',
    );
    dynamicHeight();
  };

  const dynamicHeight = () =>
    DynamicHeight.dynamicHeightDevTools(editorInput, window);
  dynamicHeight();
}

/**
 * This perfoms the typed request to API
 */
async function send(editorInput, editorOutput, firstTime = false) {
  try {
    const groups = analyzeGroups(editorInput);

    const desiredGroup = calculateWhichGroup(editorInput, firstTime, groups);

    if (desiredGroup) {
      if (firstTime) {
        const cords = editorInput.cursorCoords({
          line: desiredGroup.start,
          ch: 0,
        });
        const currentPlayButton = $('#play_button').offset();
        $('#play_button').offset({
          top: cords.top /*+ 2*/,
          left: currentPlayButton.left,
        });
      }

      const affectedGroups = checkJsonParseError(editorInput, groups);
      const filteredAffectedGroups = affectedGroups.filter(
        item => item === desiredGroup.requestText,
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
        inlineSplit && inlineSplit[1] ? queryString.parse(inlineSplit[1]) : {};

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

      // Assign inline parameters
      //for (const key in extra) JSONraw[key] = extra[key];
      const path = req;

      if (typeof JSONraw === 'object') JSONraw.devTools = true;
      if (!firstTime) {
        const response = await WzRequest.apiReq(method, path, JSONraw);

        if (typeof response === 'string' && response.includes('3029')) {
          editorOutput.setValue(
            'This method is not allowed without admin mode',
          );
        } else {
          editorOutput.setValue(
            JSON.stringify((response || {}).data || {}, null, 2),
          );
        }
      }
    }

    (firstTime || !desiredGroup) && editorOutput.setValue('Welcome!');
  } catch (error) {
    //TODO: for the moment we will only add the new orchestrator to leave a message of this error in UI, but we have to deprecate the old ErrorHandler :)
    const options: UIErrorLog = {
      context: `send`,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      error: {
        error: error,
        message: error.message || error,
        title: error.name,
      },
    };
    getErrorOrchestrator().handleError(options);

    return editorOutput.setValue(parseError(error));
  }
}

function parseError(error) {
  if ((error || {}).status === -1) {
    return 'API is not reachable. Reason: timeout.';
  } else {
    const parsedError = ErrorHandler.handle(error, '', { silent: true });
    if (typeof parsedError === 'string') {
      return parsedError;
    } else if (error && error.data && typeof error.data === 'object') {
      return JSON.stringify(error);
    } else {
      return 'Empty';
    }
  }
}

function exportOutput(editor) {
  try {
    // eslint-disable-next-line
    const blob = new Blob([editor.getValue()], {
      type: 'application/json',
    });
    FileSaver.saveAs(blob, 'export.json');
  } catch (error) {
    const options: UIErrorLog = {
      context: `exportOutput`,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      error: {
        error: error,
        message: error.message || error,
        title: `${error.name}: Export JSON`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }
}

export const ToolDevTools = withGlobalBreadcrumb([
  { text: devTools.breadcrumbLabel },
])(() => {
  const [multipleKeyPressed, setMultipleKeyPressed] = useState([]);
  const editorInputRef = useRef();
  const editorOutputRef = useRef();

  useEffect(() => {
    (async function () {
      const isDarkThemeEnabled = getUiSettings().get('theme:darkMode');
      if (
        store.getState() &&
        store.getState().appStateReducers &&
        !store.getState().appStateReducers.showMenu
      ) {
        AppState.setWzMenu();
      }
      $(window.document).keydown(e => {
        if (!multipleKeyPressed.includes(e.which)) {
          setMultipleKeyPressed(state => [...state, e.which]);
        }
        if (
          multipleKeyPressed.includes(13) &&
          multipleKeyPressed.includes(16) &&
          multipleKeyPressed.length === 2
        ) {
          e.preventDefault();
          return send(editorInputRef.current, editorOutputRef.current);
        }
      });

      // eslint-disable-next-line
      $(window.document).keyup(e => {
        setMultipleKeyPressed([]);
      });
      const editorInput = (editorInputRef.current = CodeMirror.fromTextArea(
        window.document.getElementById('api_input'),
        {
          lineNumbers: true,
          matchBrackets: true,
          mode: { name: 'javascript', json: true },
          theme: isDarkThemeEnabled ? 'lesser-dark' : 'ttcn',
          foldGutter: true,
          styleSelectedText: true,
          gutters: ['CodeMirror-foldgutter'],
        },
      ));

      // Create custom varible in the editor instance
      editorInput.__widgets = [];
      editorInput.model = [];
      // Register plugin for code mirror
      CodeMirror.commands.autocomplete = function (cm) {
        CodeMirror.showHint(cm, CodeMirror.hint.dictionaryHint, {
          completeSingle: false,
        });
      };

      editorInput.on('change', () => {
        const groups = analyzeGroups(editorInput);
        // this.groups = this.analyzeGroups();
        const currentState = editorInput.getValue().toString();
        AppState.setCurrentDevTools(currentState);
        const currentGroup = calculateWhichGroup(
          editorInput,
          undefined,
          groups,
        );
        if (currentGroup) {
          const hasWidget = editorInput.__widgets.filter(
            item => item.start === currentGroup.start,
          );
          if (hasWidget.length)
            editorInput.removeLineWidget(hasWidget[0].widget);
          setTimeout(() => checkJsonParseError(editorInput), 150);
        }
      });

      editorInput.on('cursorActivity', () => {
        const groups = analyzeGroups(editorInput);
        const currentGroup = calculateWhichGroup(
          editorInput,
          undefined,
          groups,
        );
        highlightGroup(editorInput, currentGroup);
        checkJsonParseError(editorInput, groups);
      });

      editorOutputRef.current = CodeMirror.fromTextArea(
        window.document.getElementById('api_output'),
        {
          lineNumbers: true,
          matchBrackets: true,
          mode: { name: 'javascript', json: true },
          readOnly: true,
          lineWrapping: true,
          styleActiveLine: true,
          theme: isDarkThemeEnabled ? 'lesser-dark' : 'ttcn',
          foldGutter: true,
          gutters: ['CodeMirror-foldgutter'],
        },
      );

      /**
       * This loads all available paths of the API to show them in the autocomplete
       */
      try {
        const response = await GenericRequest.request('GET', '/api/routes', {});
        editorInput.model = !response.error ? response.data : [];
      } catch (error) {
        editorInput.model = [];

        const options: UIErrorLog = {
          context: `getAvailableMethods`,
          level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
          severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
          error: {
            error: error,
            message: error.message || error,
            title: error.name,
          },
        };
        getErrorOrchestrator().handleError(options);
      }

      init(editorInputRef.current, editorOutputRef.current);
      send(editorInputRef.current, editorOutputRef.current, true);
    })();
  }, []);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column' }}
      className='dev-tools-max-height'
    >
      <div className='wz-dev-box'>
        <div
          id='wz-dev-left-column'
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <span className='wz-headline-title wz-dev-title'>
            Console
            <i
              onClick={() =>
                send(editorInputRef.current, editorOutputRef.current)
              }
              title='Click to send the request'
              className='fa fa-play wz-play-dev-color cursor-pointer pull-right fa-fw wz-always-top CodeMirror-styled-background'
              id='play_button'
              aria-hidden='true'
            ></i>
            <a
              href=''
              target='__blank'
              title='Open documentation'
              className='fa fa-info-circle cursor-pointer pull-right fa-fw wz-always-top CodeMirror-styled-background'
              id='wazuh_dev_tools_documentation'
            ></a>
          </span>

          <textarea style={{ display: 'flex' }} id='api_input'></textarea>
        </div>
        <div className='wz-dev-column-separator layout-column'>
          <span>︙</span>
        </div>
        <div
          id='wz-dev-right-column'
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <span className='wz-headline-title wz-dev-title'>
            <a
              href={webDocumentationLink('user-manual/api/reference.html')}
              target='_blank'
              rel='noopener noreferrer'
            >
              <i
                className='fa fa-question wz-question-dev-color cursor-pointer pull-right fa-fw'
                aria-hidden='true'
              ></i>
            </a>
            {/* <i
              href={webDocumentationLink('user-manual/api/reference.html')}
              // onClick={help}
              className='fa fa-question wz-question-dev-color cursor-pointer pull-right fa-fw'
              aria-hidden='true'
            ></i> */}
            <i
              // ng-click='ctrl.exportOutput()'
              onClick={() => exportOutput(editorOutputRef.current)}
              tooltip='Export as JSON'
              tooltip-placement='bottom'
              className='fa fa-download wz-question-dev-color cursor-pointer pull-right fa-fw'
              aria-hidden='true'
            ></i>
          </span>
          <textarea style={{ display: 'flex' }} id='api_output'></textarea>
        </div>
      </div>
      {/* </md-content> */}
    </div>
  );
});
