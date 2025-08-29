import CodeMirror from '../../../../utils/codemirror/lib/codemirror';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import { analyzeGroups, calculateWhichGroup } from './grouping';

/**
 * Ensure the autocomplete command is configured to use our dictionary hint provider.
 */
export function ensureAutocompleteCommand() {
  CodeMirror.commands.autocomplete = function (cm: any) {
    CodeMirror.showHint(cm, (CodeMirror as any).hint.dictionaryHint, {
      completeSingle: false,
    });
  };
}

/**
 * Register a CodeMirror hint helper that provides endpoint, query and body parameter hints.
 * Requires that `editorInput.model` contains the available API description.
 */
export function registerDictionaryHint(editorInput: any) {
  CodeMirror.registerHelper('hint', 'dictionaryHint', function (editor: any) {
    const model = editorInput.model;
    function getDictionary(line: string, word: string) {
      let hints: any[] = [];
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
            .filter((item: string) => item)
            .map((item: string) => item.toLowerCase())) ||
        [];
      // Get all API endpoints with http method in the request
      const inputHttpMethodEndpoints =
        (model.find((item: any) => item.method === inputHttpMethod) || {})
          .endpoints || [];
      // Find the API endpoint in the request
      const apiEndpoint = inputHttpMethodEndpoints
        .map((endpoint: any) => ({
          ...endpoint,
          splitURL: endpoint.name.split('/').filter((item: string) => item),
        }))
        .filter(
          (endpoint: any) => endpoint.splitURL.length === inputEndpoint.length,
        )
        .find((endpoint: any) =>
          endpoint.splitURL.reduce(
            (accum: boolean, str: string, index: number) =>
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
                .filter((item: string) => item)
                .map((item: string) => {
                  const [key, value] = item.split('=');
                  return { key, value };
                })) ||
            [];
          // It is defining query param value query_param=
          const definingQueryParamValue =
            inputQueryParams && inputQueryParams.includes('&')
              ? (inputRequest as string).lastIndexOf('=') >
                (inputRequest as string).lastIndexOf('&')
              : !!(inputQueryParams || '').includes('?') ||
                (inputRequest as string).lastIndexOf('=') >
                  (inputRequest as string).lastIndexOf('?');

          if (!definingQueryParamValue && apiEndpoint && apiEndpoint.query) {
            const inputQueryPreviousEntriesKeys = inputQuery
              .filter((query: any) => query.key && query.value)
              .map((query: any) => query.key);
            hints = apiEndpoint.query
              .filter(
                (query: any) =>
                  !inputQueryPreviousEntriesKeys.includes(query.name),
              )
              .map(
                (item: any) =>
                  `${inputPath}${inputQuery
                    .filter((query: any) => query.key && query.value)
                    .reduce(
                      (accum: string, query: any, index: number) =>
                        `${accum}${index > 0 ? '&' : ''}${query.key}=${
                          query.value
                        }`,
                      '?',
                    )}${
                    inputQuery.filter((query: any) => query.key && query.value)
                      .length > 0
                      ? '&'
                      : ''
                  }${item.name}=`,
              );
          }
        } else if (inputHttpMethod) {
          // Get hints for all http method endpoint
          if (!inputPath) {
            hints = inputHttpMethodEndpoints.map(
              (endpoint: any) => endpoint.name,
            );
          } else {
            // Get hints for requests as: http_method api_path
            hints = inputHttpMethodEndpoints
              .map((endpoint: any) => ({
                ...endpoint,
                splitURL: endpoint.name
                  .split('/')
                  .filter((item: string) => item),
              }))
              .filter((endpoint: any) =>
                endpoint.splitURL.reduce(
                  (accum: boolean, splitPath: string, index: number) => {
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
                    return false;
                  },
                  true,
                ),
              )
              .map((endpoint: any) =>
                endpoint.splitURL.reduce(
                  (accum: string, splitPath: string, index: number) =>
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

        const renderBodyParam = (parameter: any, space: string) => {
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
                  `${space}\t${renderBodyParam(
                    {
                      name: keyProperty,
                      ...parameter.properties[keyProperty],
                    },
                    space + '\t',
                  )}${lastIndex !== index ? ',' : ''}`,
              )
              .join('\n')}\n${space}}`;
          }
          return `"${parameter.name}": ${valueBodyParam}`;
        };

        const getInnerKeysBodyRequest = () => {
          let jsonBodyKeyCurrent: string[] = [];
          let jsonBodyKeyCurrentPosition = {
            start: { line: currentGroup.start, ch: 0 },
            end: { line: currentGroup.start, ch: 0 },
          };
          return [
            ...Array(currentGroup.end + 1 - currentGroup.start).keys(),
          ].reduce((jsonBodyKeyCursor: any, lineNumberRange: number) => {
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
        const getInnerPropertyBodyParamObject = (
          object: any,
          keys: string[],
        ) => {
          if (!keys || !keys.length) {
            return object;
          }
          const key = keys.shift() as string;
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
          let inputBodyPreviousKeys: string[] = [];
          let paramsBody = apiEndpoint.body;
          let requestBodyCursorKeys: string[] | undefined;
          if (apiEndpoint.body[0].type === 'object') {
            requestBodyCursorKeys = getInnerKeysBodyRequest();
            const paramInnerBody = getInnerPropertyBodyParamObject(
              apiEndpoint.body[0],
              [...(requestBodyCursorKeys || [])],
            );
            paramsBody = Object.keys(paramInnerBody.properties)
              .sort()
              .map((keyBodyParam: string) => ({
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
                (acumm: any, key: string) => acumm[key],
                JSON.parse(bodySanitizedBodyParam),
              ),
            );
          } catch (error: any) {
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
              (bodyParam: any) =>
                !inputBodyPreviousKeys.includes(bodyParam.name) &&
                bodyParam.name &&
                (inputKeyBodyParam
                  ? bodyParam.name.includes(inputKeyBodyParam)
                  : true),
            )
            .map((bodyParam: any) => ({
              text: renderBodyParam(bodyParam, spaceLineStart),
              _moveCursor: ['string', 'array'].includes(bodyParam.type),
              displayText: bodyParam.name,
              bodyParam,
              hint: (cm: any, self: any, data: any) => {
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
        hints = model.map((a: any) => a.method);
      }
      const final_hints = hints.map(chain => {
        // Avoid errors when hint is not a string (e.g. request body parameters)
        if (typeof chain !== 'string') {
          return chain;
        }
        let t = 0;
        return (chain = chain.replace(/\?/g, (match: string) => {
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
        : (getDictionary(curLine, curWord) as any[]).filter(function (
            item: any,
          ) {
            const text = (item.text || item) as string;
            return text
              .toUpperCase()
              .includes((curWord as string).toUpperCase());
          })
      ).sort(),
      from: CodeMirror.Pos(cur.line, start),
      to: CodeMirror.Pos(cur.line, end),
    };
  });
}
