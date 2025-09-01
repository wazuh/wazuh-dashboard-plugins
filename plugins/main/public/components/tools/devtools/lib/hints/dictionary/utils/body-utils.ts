import type { EditorLike, EditorGroup } from '../../../types/editor';
import type { BodyParamDef } from '../types';
import { BODY_LINE_START_RE } from '../constants';

/** Extract indentation and the partial key being typed on a JSON body line. */
export function extractBodyLineContext(line: string) {
  const match = line.match(BODY_LINE_START_RE) || [] as any;
  const spaceLineStart = match[1] || '';
  const inputKeyBodyParam = match[2] || '';
  return { spaceLineStart, inputKeyBodyParam };
}

/** Render a JSON body parameter line, recursively expanding objects. */
export function renderBodyParamText(parameter: BodyParamDef, space: string): string {
  let valueBodyParam = '';
  if (parameter.type === 'string') {
    valueBodyParam = '""';
  } else if (parameter.type === 'array') {
    valueBodyParam = '[]';
  } else if (parameter.type === 'object') {
    const keys = Object.keys(parameter.properties || {}).sort();
    const lastIndex = keys.length - 1;
    const inner = keys
      .map((keyProp, index) =>
        `${space}\t${renderBodyParamText({ name: keyProp, ...(parameter.properties || {})[keyProp]! }, space + '\t')}${lastIndex !== index ? ',' : ''}`,
      )
      .join('\n');
    valueBodyParam = `{\n${inner}\n${space}}`;
  }
  return `\"${parameter.name}\": ${valueBodyParam}`;
}

/**
 * Traverse the editor buffer in the active group to infer the nested object
 * path at the current cursor position inside the JSON body.
 */
export function getCursorObjectPath(
  editor: EditorLike,
  group: EditorGroup,
): string[] | false {
  let jsonBodyKeyCurrent: string[] = [];
  let jsonBodyKeyCurrentPosition = {
    start: { line: group.start, ch: 0 },
    end: { line: group.start, ch: 0 },
  };

  // @ts-ignore: we only need numeric range
  return [...Array(group.end + 1 - group.start).keys()].reduce(
    (jsonBodyKeyCursor: any, lineNumberRange: number) => {
      const editorLineNumber = group.start + lineNumberRange;
      const editorLineContent = editor.getLine ? editor.getLine(editorLineNumber) : '';
      const openBracket = editorLineContent.indexOf('{');
      const closeBracket = editorLineContent.indexOf('}');
      const keyOpenBracket = (editorLineContent.match(/\s*\"(\S+)\"\s*:\s*\{/) || [])[1];

      if (keyOpenBracket) {
        jsonBodyKeyCurrent.push(keyOpenBracket);
        jsonBodyKeyCurrentPosition.start = { line: editorLineNumber, ch: openBracket };
      }
      if (closeBracket !== -1) {
        jsonBodyKeyCurrentPosition.end = { line: editorLineNumber, ch: closeBracket };
      }
      const cursor = editor.getCursor ? editor.getCursor() : { line: 0, ch: 0 };
      if (
        !jsonBodyKeyCursor &&
        cursor.line > jsonBodyKeyCurrentPosition.start.line &&
        cursor.line < jsonBodyKeyCurrentPosition.end.line
      ) {
        jsonBodyKeyCursor = [...jsonBodyKeyCurrent];
      }
      if (closeBracket !== -1) jsonBodyKeyCurrent.pop();
      return jsonBodyKeyCursor;
    },
    false,
  );
}

/** Navigate a body schema down a path of keys, returning the nested object schema or []. */
export function getInnerObjectFromSchema(
  object: BodyParamDef,
  keys: string[],
): BodyParamDef | [] {
  if (!keys || !keys.length) {
    return object;
  }
  const [key, ...rest] = keys;
  if (!object.properties || !object.properties[key] || object.properties[key].type !== 'object') {
    return [];
  }
  return getInnerObjectFromSchema(object.properties[key], rest);
}

/** Remove trailing dangling keys to allow JSON.parse of incomplete bodies. */
export function sanitizeJsonBody(json: string): string {
  return json.replace(/(,?\s*\"\S*\s*)\}/g, '}');
}

/** Get existing keys at the cursor path to avoid suggesting duplicates. */
export function getExistingKeysAtCursor(
  jsonBody: string,
  pathKeys: string[] = [],
): string[] {
  const sanitized = sanitizeJsonBody(jsonBody);
  // Walk into nested object to get keys of current object
  const obj = JSON.parse(sanitized);
  const target = pathKeys.reduce((acc: any, key: string) => acc?.[key], obj);
  return Object.keys(target || {});
}
