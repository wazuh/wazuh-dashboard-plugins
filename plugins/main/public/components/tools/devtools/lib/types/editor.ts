/**
 * Minimal shapes used from CodeMirror to avoid pervasive `any`.
 * These intentionally mirror only what's needed by DevTools.
 */
export interface EditorGroup {
  requestText: string;
  requestTextJson: string;
  start: number;
  end: number;
}

export interface CursorPos {
  line: number;
  ch: number;
}

export interface CursorCoords {
  top: number;
}

export interface EditorLike {
  getValue(): string | { toString(): string };
  setSize(width: string | number, height: string | number): void;
  getDoc(): { setValue(v: string): void };
  on(event: string, handler: (...args: any[]) => void): void;
  getCursor(): CursorPos;
  cursorCoords(pos: CursorPos): CursorCoords;
  getSearchCursor?(query: string, pos?: any, options?: any): {
    findNext(): boolean;
    from(): CursorPos;
  };
  getLine?(n: number): string;
  addLineClass?(line: number, where: string, className: string): void;
  removeLineClass?(line: number, where: string, className: string): void;
  addLineWidget?(
    line: number,
    node: any,
    options?: { coverGutter?: boolean; noHScroll?: boolean },
  ): any;
  removeLineWidget?(widget: any): void;
  getWrapperElement?(): HTMLElement;
  display?: { wrapper?: HTMLElement };
  __widgets?: Array<{ start: number; widget: any }>;
  __groupsCache?: EditorGroup[];
  __highlightedLines?: number[];
  model?: any[];
  replaceRange?(
    text: string,
    from: { line: number; ch: number },
    to?: { line: number; ch: number },
  ): void;
  setCursor?(pos: { line: number; ch: number }): void;
}

export interface SendHooksMeta {
  status?: number;
  statusText?: string;
  durationMs: number;
  ok: boolean;
}

export interface SendHooks {
  onStart?: () => void;
  onEnd?: (meta: SendHooksMeta) => void;
}

