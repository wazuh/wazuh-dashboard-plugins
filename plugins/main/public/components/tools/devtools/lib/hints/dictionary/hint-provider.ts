import type { EditorLike, EditorGroup } from '../../types/editor';
import type {
  BodyParamDef,
  DevToolsModel,
  EndpointDef,
  HintItem,
  MethodDef,
} from './types';
import { LABEL_ENDPOINT, LABEL_FLAG, LABEL_PARAM } from './constants';
import { createHintRenderer } from './utils/hint-renderer';
import {
  findMatchingEndpoint,
  getMethodEndpoints,
  parseRequestLine,
  splitPathToSegments,
} from './utils/endpoint-utils';
import {
  extractBodyLineContext,
  getCursorObjectPath,
  getExistingKeysAtCursor,
  getInnerObjectFromSchema,
  renderBodyParamText,
} from './utils/body-utils';
import {
  buildNextPathWithQuery,
  isDefiningQueryParamValue,
  parseQueryString,
} from './utils/query-utils';
import { dedupeByText, limitToSingleQuestionMark } from './utils/hint-utils';

export interface HintProviderDeps {
  analyzeGroups: (editor: EditorLike) => EditorGroup[];
  calculateWhichGroup: (
    editor: EditorLike,
    firstTime?: boolean,
    groups?: EditorGroup[],
  ) => EditorGroup | null;
  logError: (context: string, error: any) => void;
  getModel: () => DevToolsModel | undefined;
}

export class DictionaryHintProvider {
  constructor(private readonly deps: HintProviderDeps) {}

  private getModel(): DevToolsModel {
    return this.deps.getModel() || [];
  }

  buildHints(
    editor: EditorLike,
    line: string,
    word: string,
  ): Array<HintItem | string> {
    const model = this.getModel();
    const groups = this.deps.analyzeGroups(editor);
    const currentGroup = this.deps.calculateWhichGroup(
      editor,
      undefined,
      groups,
    );
    const editorCursor = editor.getCursor
      ? editor.getCursor()
      : { line: 0, ch: 0 };

    // Early fallback: list methods if nothing else
    const fallback = () =>
      model.map((m: MethodDef) => m.method) as Array<string>;

    if (!currentGroup) return fallback();

    const { method, path, queryMark, queryString } = parseRequestLine(
      currentGroup.requestText,
    );
    const inputEndpoint = splitPathToSegments(path);
    const methodEndpoints = getMethodEndpoints(model, method);
    const apiEndpoint: EndpointDef | undefined = findMatchingEndpoint(
      methodEndpoints,
      inputEndpoint,
    );

    const isOnRequestLine =
      !!line.split(/\s+/g)[0] &&
      currentGroup.start === editorCursor.line &&
      !word.includes('{');

    if (isOnRequestLine) {
      // Query param suggestions
      if (method && path && queryMark) {
        const inputQuery = parseQueryString(queryString);
        const definingValue = isDefiningQueryParamValue(
          currentGroup.requestText,
          queryString,
        );
        if (!definingValue && apiEndpoint && apiEndpoint.query) {
          const previousKeys = inputQuery
            .filter(q => q.key && q.value)
            .map(q => q.key);
          return limitToSingleQuestionMark(
            apiEndpoint.query
              .filter(q => !previousKeys.includes(q.name))
              .map(q => {
                const nextPath = buildNextPathWithQuery(
                  path!,
                  inputQuery,
                  q.name,
                );
                const isFlag = (q.schema || {}).type === 'boolean';
                return {
                  text: nextPath,
                  displayText: q.name,
                  render: createHintRenderer(isFlag ? LABEL_FLAG : LABEL_PARAM),
                } as HintItem;
              }),
          );
        }
      }
      // Endpoint path suggestions
      if (method) {
        if (!path || path === '/') {
          return methodEndpoints.map(e => ({
            text: e.name,
            displayText: e.name,
            render: createHintRenderer(LABEL_ENDPOINT),
          }));
        }
        const inputPathLc = String(path).toLowerCase();
        const prefixMatches = methodEndpoints
          .filter(e => String(e.name).toLowerCase().startsWith(inputPathLc))
          .map(e => ({
            text: e.name,
            displayText: e.name,
            render: createHintRenderer(LABEL_ENDPOINT),
          }));

        const structuredMatches = methodEndpoints
          .map(e => ({ ...e, splitURL: e.name.split('/').filter(Boolean) }))
          .filter(e =>
            (e.splitURL || []).reduce(
              (acc: boolean, seg: string, idx: number) => {
                if (!acc) return acc;
                if (
                  seg.startsWith(':') ||
                  !inputEndpoint[idx] ||
                  (inputEndpoint[idx] &&
                    seg.toLowerCase().startsWith(inputEndpoint[idx]))
                ) {
                  return true;
                }
                return false;
              },
              true,
            ),
          )
          .map(e => {
            const suggestion = (e.splitURL || []).reduce(
              (acc: string, seg: string, idx: number) =>
                `${acc}/${(seg.startsWith(':') && inputEndpoint[idx]) || seg}`,
              '',
            );
            return {
              text: suggestion,
              displayText: suggestion,
              render: createHintRenderer(LABEL_ENDPOINT),
            } as HintItem;
          });

        const allEndpoints = methodEndpoints.map(e => ({
          text: e.name,
          displayText: e.name,
          render: createHintRenderer(LABEL_ENDPOINT),
        }));
        return dedupeByText([
          ...prefixMatches,
          ...structuredMatches,
          ...allEndpoints,
        ]) as HintItem[];
      }
    }

    // Body param suggestions inside JSON block
    const insideBodyBlock =
      !!currentGroup.requestText &&
      !!currentGroup.requestTextJson &&
      currentGroup.start < editorCursor.line &&
      currentGroup.end > editorCursor.line;

    if (insideBodyBlock) {
      const { spaceLineStart, inputKeyBodyParam } =
        extractBodyLineContext(line);
      if (
        apiEndpoint &&
        apiEndpoint.body &&
        /^(\s*)(?:\"|')(\S*)(?::)?$/.test(line)
      ) {
        let paramsBody: BodyParamDef[] = apiEndpoint.body;
        let requestBodyCursorKeys: string[] | undefined;

        if (apiEndpoint.body[0]?.type === 'object') {
          requestBodyCursorKeys = (getCursorObjectPath(editor, currentGroup) ||
            undefined) as any;
          const inner = getInnerObjectFromSchema(
            apiEndpoint.body[0] as BodyParamDef,
            [...(requestBodyCursorKeys || [])],
          );
          if (Array.isArray(inner)) return [];
          paramsBody = Object.keys(inner.properties || {})
            .sort()
            .map(k => ({ name: k, ...(inner.properties || {})[k]! }));
        }

        let inputBodyPreviousKeys: string[] = [];
        try {
          inputBodyPreviousKeys = getExistingKeysAtCursor(
            currentGroup.requestTextJson,
            requestBodyCursorKeys || [],
          );
        } catch (err) {
          inputBodyPreviousKeys = [];
          this.deps.logError('getDictionary', err);
        }

        return paramsBody
          .filter(
            p =>
              !inputBodyPreviousKeys.includes(p.name) &&
              p.name &&
              (inputKeyBodyParam ? p.name.includes(inputKeyBodyParam) : true),
          )
          .map(
            p =>
              ({
                text: renderBodyParamText(p, spaceLineStart),
                _moveCursor: ['string', 'array'].includes(p.type),
                displayText: p.name,
                bodyParam: p,
                render: createHintRenderer(LABEL_PARAM),
                hint: (cm: any, _self: any, data: any) => {
                  const cur = editor.getCursor
                    ? editor.getCursor()
                    : { line: 0, ch: 0 };
                  (editor as any).replaceRange(
                    line.replace(/\S+/, '') + data.text,
                    { line: cur.line, ch: cur.ch },
                    { line: cur.line, ch: 0 },
                  );
                  const textReplacedLine = (editor as any).getLine(cur.line);
                  (editor as any).setCursor({
                    line: cur.line,
                    ch: data._moveCursor
                      ? textReplacedLine.length - 1
                      : textReplacedLine.length,
                  });
                },
              } as HintItem),
          );
      }
    }

    // Fallback: methods list
    return fallback();
  }
}
