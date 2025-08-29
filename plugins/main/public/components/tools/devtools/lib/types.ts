/**
 * Shared DevTools types used across the module.
 */

export interface EditorLike {
  /** Returns the whole editor value as string */
  getValue: () => string;
  /** Sets the editor content */
  setValue?: (value: string) => void;
  /** CodeMirror API: get current cursor position */
  getCursor?: () => { line: number; ch: number };
  /** CodeMirror API: get a line content */
  getLine?: (line: number) => string;
  /** CodeMirror API: get document object */
  getDoc?: () => { setValue: (value: string) => void };
  /** CodeMirror API: search cursor factory */
  getSearchCursor?: (query: string, pos?: any, options?: any) => {
    findNext: () => boolean;
    from: () => { line: number; ch: number };
  };
  /** CodeMirror API: cursor coordinates */
  cursorCoords?: (pos: { line: number; ch: number }) => { top: number };
  /** CodeMirror API: add a CSS class to a line */
  addLineClass?: (line: number, where: string, cls: string) => void;
  /** CodeMirror API: remove a CSS class from a line */
  removeLineClass?: (line: number, where: string, cls: string) => void;
  /** Iterate editor lines */
  eachLine?: (fn: (line: any) => void) => void;
  /** Array of widgets used by linting feedback */
  __widgets?: Array<{ start: number; widget: any }>;
}

export interface EditorGroup {
  /** Original request line e.g. GET /agents?status=active */
  requestText: string;
  /** JSON request body (when present) as raw string */
  requestTextJson: string;
  /** Start line index (inclusive) */
  start: number;
  /** End line index (inclusive) */
  end: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

