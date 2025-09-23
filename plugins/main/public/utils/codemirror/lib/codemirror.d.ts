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

  interface Doc {
    setValue(value: string): void;
  }

  interface LineWidget {
    clear?: () => void;
    changed?: () => void;
    // Allow additional members without strict typing
    [key: string]: any;
  }

  interface SearchCursor {
    findNext(): boolean;
    findPrevious?(): boolean;
    from(): Position;
    to?(): Position;
  }

  type EditorEventName =
    | 'change'
    | 'cursorActivity'
    | 'keyup'
    | 'scroll'
    | string;

  interface Editor {
    // Core value/cursor APIs
    getValue(): string;
    setValue(value: string): void;
    getCursor(start?: string): Position;
    cursorCoords(
      where?: Position | 'from' | 'to',
      mode?: 'local' | 'page' | 'window',
    ): CursorCoords;

    // Document, lines and layout
    getDoc(): Doc;
    getLine(line: number): string;
    setSize(width: string | number, height: string | number): void;
    getWrapperElement(): HTMLElement;

    // Events and commands
    on(
      event: EditorEventName,
      handler: (cm: Editor, ev?: KeyboardEvent) => void,
    ): void;
    execCommand?(name: string, ...args: unknown[]): void;

    // Range/cursor manipulation
    replaceRange(text: string, from: Position, to?: Position): void;
    setCursor(pos: Position): void;

    // Line classes/widgets (lint feedback, etc.)
    addLineClass(line: number, where: string, cls: string): void;
    removeLineClass(line: number, where: string, cls: string): void;
    addLineWidget(
      line: number,
      node: HTMLElement,
      options?: { coverGutter?: boolean; noHScroll?: boolean },
    ): LineWidget;
    removeLineWidget(widget: LineWidget): void;

    // Addon methods (optional)
    getSearchCursor?(
      query: string | RegExp,
      pos?: Position | null,
      caseFoldOrOptions?: boolean | unknown,
    ): SearchCursor;

    // Internal/editor DOM (do not rely on in app code)
    display?: { wrapper?: HTMLElement };
  }

  interface HintResult<T = unknown> {
    from: Position;
    to: Position;
    list: T[];
  }

  interface ShowHintOptions<T = unknown> {
    completeSingle?: boolean;
    hint?: (cm: Editor) => HintResult<T> | undefined;
  }

  const Pass: unique symbol | any;

  const commands: { [key: string]: (cm: Editor) => void };

  function fromTextArea(
    textarea: HTMLElement | null,
    options?: unknown,
  ): Editor;

  function registerHelper(type: string, name: string, value: any): void;

  function showHint<T = unknown>(
    cm: Editor,
    getHints?: (
      cm: Editor,
      options?: ShowHintOptions<T>,
    ) => HintResult<T> | undefined,
    options?: ShowHintOptions<T>,
  ): void;

  function Pos(line: number, ch: number): Position;

  const hint: any;

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
