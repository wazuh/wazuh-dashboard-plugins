// Minimal TypeScript typings for the bundled CodeMirror (v5) used locally.
// This focuses on the APIs referenced by our TS files.

declare namespace CodeMirror {
  type Position = { line: number; ch: number };

  interface CursorCoords {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  interface Editor {
    getValue(): string;
    setValue(value: string): void;
    getCursor(start?: string): Position;
    cursorCoords(where?: any, mode?: 'local' | 'page' | 'window'): CursorCoords;
  }

  interface HintResult<T = any> {
    from: Position;
    to: Position;
    list: T[];
  }

  interface ShowHintOptions<T = any> {
    completeSingle?: boolean;
    hint?: (cm: Editor) => HintResult<T> | undefined;
  }

  const Pass: unique symbol | any;

  const commands: { [key: string]: (cm: Editor) => void };

  function fromTextArea(textarea: any, options?: any): Editor;

  function registerHelper(type: string, name: string, value: any): void;

  function showHint<T = any>(
    cm: Editor,
    getHints?: (
      cm: Editor,
      options?: ShowHintOptions<T>,
    ) => HintResult<T> | undefined,
    options?: ShowHintOptions<T>,
  ): void;

  function Pos(line: number, ch: number): Position;

  const hint: any;

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
    getSearchCursor?: (
      query: string,
      pos?: any,
      options?: any,
    ) => {
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
}

declare const CodeMirror: {
  fromTextArea: typeof CodeMirror.fromTextArea;
  registerHelper: typeof CodeMirror.registerHelper;
  showHint: typeof CodeMirror.showHint;
  commands: typeof CodeMirror.commands;
  hint: typeof CodeMirror.hint;
  Pos: typeof CodeMirror.Pos;
  // Allow access to additional members without strict typing
  [key: string]: any;
};

export default CodeMirror;
