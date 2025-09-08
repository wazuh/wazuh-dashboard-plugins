import type { HintStrategy } from './hint-strategy';
import type { HintItem, BodyParamDef } from '../types';
import type { HintContext } from '../context';
import { createHintRenderer } from '../utils/hint-renderer';
import { LABEL_PARAM } from '../constants';
import {
  extractBodyLineContext,
  getCursorObjectPath,
  getExistingKeysAtCursor,
  getInnerObjectFromSchema,
  renderBodyParamText,
} from '../utils/body-utils';

/**
 * Strategy for suggestions while cursor is inside a JSON body block.
 * Provides available body keys based on schema and current cursor nesting.
 */
export class BodyHintStrategy implements HintStrategy {
  canHandle(context: HintContext): boolean {
    return context.isInsideBodyBlock;
  }

  getHints(context: HintContext): Array<HintItem | string> {
    const { line, editor, currentGroup, apiEndpoint } = context;

    if (!currentGroup || !apiEndpoint || !apiEndpoint.body) return [];

    // Only when typing a key
    if (!/^(\s*)(?:\"|')(\S*)(?::)?$/.test(line)) return [];

    const { spaceLineStart, inputKeyBodyParam } = extractBodyLineContext(line);

    let paramsBody: BodyParamDef[] = apiEndpoint.body;
    let requestBodyCursorKeys: string[] | undefined;

    if (apiEndpoint.body[0]?.type === 'object') {
      const path = getCursorObjectPath(editor, currentGroup);
      requestBodyCursorKeys = Array.isArray(path) ? path : undefined;
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
      // Let the provider log this error
      throw err;
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
            hint: (_cm, _self, data) => {
              const cur = editor.getCursor
                ? editor.getCursor()
                : { line: 0, ch: 0 };
              editor.replaceRange?.(
                line.replace(/\S+/, '') + String((data as HintItem).text),
                { line: cur.line, ch: cur.ch },
                { line: cur.line, ch: 0 },
              );
              const textReplacedLine = editor.getLine?.(cur.line) || '';
              editor.setCursor?.({
                line: cur.line,
                ch: (data as HintItem)._moveCursor
                  ? textReplacedLine.length - 1
                  : textReplacedLine.length,
              });
            },
          } as HintItem),
      );
  }
}
