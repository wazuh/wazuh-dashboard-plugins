import type { EditorLike, EditorGroup } from '../../types/editor';
import type { DevToolsModel, EndpointDef, MethodDef } from './types';
import type { ParsedRequestLine } from './utils/endpoint-utils';
import {
  findMatchingEndpoint,
  getMethodEndpoints,
  parseRequestLine,
  splitPathToSegments,
} from './utils/endpoint-utils';

/**
 * Context object shared across hint strategies to avoid recomputation.
 */
export interface HintContext {
  editor: EditorLike;
  line: string;
  word: string;
  model: DevToolsModel;
  groups: EditorGroup[];
  currentGroup: EditorGroup | null;
  cursorLine: number;
  parsed: ParsedRequestLine;
  inputEndpoint: string[];
  methodEndpoints: EndpointDef[];
  apiEndpoint?: EndpointDef;
  isOnRequestLine: boolean;
  isInsideBodyBlock: boolean;
}

/** Determine if the cursor is on the HTTP request line. */
export function isCursorOnRequestLine(
  line: string,
  word: string,
  current: EditorGroup | null,
  cursorLine: number,
): boolean {
  if (!current) return false;
  const firstToken = (line.split(/\s+/g)[0] || '').trim();
  return (
    Boolean(firstToken) && current.start === cursorLine && !word.includes('{')
  );
}

/** Determine if the cursor is currently inside a JSON body block. */
export function isCursorInsideBodyBlock(
  current: EditorGroup | null,
  cursorLine: number,
): boolean {
  if (!current) return false;
  return (
    !!current.requestText &&
    !!current.requestTextJson &&
    current.start < cursorLine &&
    current.end > cursorLine
  );
}

/**
 * Build a comprehensive hint context used by strategies.
 */
export function buildHintContext(
  editor: EditorLike,
  line: string,
  word: string,
  model: DevToolsModel,
  groups: EditorGroup[],
  currentGroup: EditorGroup | null,
): HintContext {
  const cursor = editor.getCursor ? editor.getCursor() : { line: 0, ch: 0 };
  const parsed = parseRequestLine(currentGroup?.requestText);
  const inputEndpoint = splitPathToSegments(parsed.path);
  const methodEndpoints = getMethodEndpoints(model, parsed.method);
  const apiEndpoint = findMatchingEndpoint(methodEndpoints, inputEndpoint);

  const onRequestLine = isCursorOnRequestLine(
    line,
    word,
    currentGroup,
    cursor.line,
  );
  const insideBody = isCursorInsideBodyBlock(currentGroup, cursor.line);

  return {
    editor,
    line,
    word,
    model,
    groups,
    currentGroup,
    cursorLine: cursor.line,
    parsed,
    inputEndpoint,
    methodEndpoints,
    apiEndpoint,
    isOnRequestLine: onRequestLine,
    isInsideBodyBlock: insideBody,
  };
}
