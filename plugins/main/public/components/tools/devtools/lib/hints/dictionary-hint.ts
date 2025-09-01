import CodeMirror from '../../../../../utils/codemirror/lib/codemirror';
import { analyzeGroups, calculateWhichGroup } from '../grouping';
import { REQUEST_LINE_REGEX } from '../constants/regex';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../../react-services/error-orchestrator/types';

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
      const [
        inputRequest,
        inputHttpMethod,
        inputPath,
        inputQueryParamsStart,
        inputQueryParams,
      ] =
        (currentGroup &&
          currentGroup.requestText &&
          currentGroup.requestText.match(REQUEST_LINE_REGEX)) ||
        [];
      const inputEndpoint =
        (inputPath &&
          inputPath
            .split('/')
            .filter((item: string) => item)
            .map((item: string) => item.toLowerCase())) ||
        [];
      const inputHttpMethodEndpoints =
        (model.find((item: any) => item.method === inputHttpMethod) || {})
          .endpoints || [];
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
      const makeRender =
        (label: string) => (elt: HTMLElement, _data: any, cur: any) => {
          try {
            const wrap = document.createElement('div');
            wrap.className = 'wz-hint';
            const left = document.createElement('span');
            left.className = 'wz-hint__text';
            left.textContent = cur.displayText || cur.text || '';
            const right = document.createElement('span');
            right.className = 'wz-hint__label';
            right.textContent = label;
            wrap.appendChild(left);
            wrap.appendChild(right);
            elt.appendChild(wrap);
          } catch (e) {
            elt.appendChild(
              document.createTextNode(
                (cur.displayText || cur.text || '') as string,
              ),
            );
          }
        };

      if (
        exp[0] &&
        currentGroup &&
        currentGroup.start === editorCursor.line &&
        !word.includes('{')
      ) {
        if (inputHttpMethod && inputPath && inputQueryParamsStart) {
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
              .map((item: any) => {
                const nextPath = `${inputPath}${inputQuery
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
                }${item.name}=`;
                const isFlag = (item.schema || {}).type === 'boolean';
                return {
                  text: nextPath,
                  displayText: item.name,
                  render: makeRender(isFlag ? 'flag' : 'param'),
                };
              });
          }
        } else if (inputHttpMethod) {
          if (!inputPath || inputPath === '/') {
            hints = inputHttpMethodEndpoints.map((endpoint: any) => ({
              text: endpoint.name,
              displayText: endpoint.name,
              render: makeRender('endpoint'),
            }));
          } else {
            const inputPathLc = String(inputPath).toLowerCase();
            const prefixMatches = inputHttpMethodEndpoints
              .filter((endpoint: any) =>
                String(endpoint.name).toLowerCase().startsWith(inputPathLc),
              )
              .map((endpoint: any) => ({
                text: endpoint.name,
                displayText: endpoint.name,
                render: makeRender('endpoint'),
              }));
            const structuredMatches = inputHttpMethodEndpoints
              .map((endpoint: any) => ({
                ...endpoint,
                splitURL: endpoint.name
                  .split('/')
                  .filter((item: string) => item),
              }))
              .filter((endpoint: any) =>
                endpoint.splitURL.reduce(
                  (accum: boolean, splitPath: string, index: number) => {
                    if (!accum) return accum;
                    if (
                      splitPath.startsWith(':') ||
                      !inputEndpoint[index] ||
                      (inputEndpoint[index] &&
                        splitPath
                          .toLowerCase()
                          .startsWith(inputEndpoint[index]))
                    ) {
                      return true;
                    }
                    return false;
                  },
                  true,
                ),
              )
              .map((endpoint: any) => {
                const suggestion = endpoint.splitURL.reduce(
                  (accum: string, splitPath: string, index: number) =>
                    `${accum}/${
                      (splitPath.startsWith(':') && inputEndpoint[index]) ||
                      splitPath
                    }`,
                  '',
                );
                return {
                  text: suggestion,
                  displayText: suggestion,
                  render: makeRender('endpoint'),
                };
              });
            const allEndpoints = inputHttpMethodEndpoints.map(
              (endpoint: any) => ({
                text: endpoint.name,
                displayText: endpoint.name,
                render: makeRender('endpoint'),
              }),
            );
            const seen: Record<string, boolean> = {};
            hints = [
              ...prefixMatches,
              ...structuredMatches,
              ...allEndpoints,
            ].filter(item => {
              const key = String((item as any).text || item);
              if (seen[key]) return false;
              seen[key] = true;
              return true;
            });
          }
        }
      } else if (
        currentGroup &&
        currentGroup.requestText &&
        currentGroup.requestTextJson &&
        currentGroup.start < editorCursor.line &&
        currentGroup.end > editorCursor.line
      ) {
        const reLineStart = /^(\s*)(?:\"|')(\S*)(?::)?$/;
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
          return `\"${parameter.name}\": ${valueBodyParam}`;
        };

        const getInnerKeysBodyRequest = () => {
          let jsonBodyKeyCurrent: string[] = [];
          let jsonBodyKeyCurrentPosition = {
            start: { line: currentGroup.start, ch: 0 },
            end: { line: currentGroup.start, ch: 0 },
          };
          return [
            // @ts-ignore
            ...Array(currentGroup.end + 1 - currentGroup.start).keys(),
          ].reduce((jsonBodyKeyCursor: any, lineNumberRange: number) => {
            const editorLineNumber = currentGroup.start + lineNumberRange;
            const editorLineContent = editor.getLine(editorLineNumber);
            const openBracket = editorLineContent.indexOf('{');
            const closeBracket = editorLineContent.indexOf('}');
            const keyOpenBracket = (editorLineContent.match(
              /\s*\"(\S+)\"\s*:\s*\{/,
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
              /(,?\s*\"\S*\s*)\}/g,
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
              render: makeRender('param'),
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
    const unfilteredList = getDictionary(
      curLine,
      (curWord as string) || '',
    ) as any[];
    const list = unfilteredList.filter(function (item: any) {
      if (!curWord) return true;
      const text = (item.text ?? item) as string;
      return text.toUpperCase().includes((curWord as string).toUpperCase());
    });
    const sortedList = list.sort((a: any, b: any) => {
      const A = ((a && (a.displayText || a.text)) || a || '')
        .toString()
        .toUpperCase();
      const B = ((b && (b.displayText || b.text)) || b || '')
        .toString()
        .toUpperCase();
      if (A < B) return -1;
      if (A > B) return 1;
      return 0;
    });

    return {
      list: sortedList,
      from: CodeMirror.Pos(cur.line, start),
      to: CodeMirror.Pos(cur.line, end),
    };
  });
}
