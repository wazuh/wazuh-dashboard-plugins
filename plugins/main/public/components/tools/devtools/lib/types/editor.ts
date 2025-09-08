import type CodeMirror from '../../../../../utils/codemirror/lib/codemirror';
import type { DevToolsModel } from '../hints/dictionary/types';

export type EditorGroup = CodeMirror.EditorGroup;
export type CursorPos = CodeMirror.Position;
export type CursorCoords = Pick<CodeMirror.CursorCoords, 'top'>;

// Internal caches and widgets used by DevTools
interface DevToolsEditorAugmentations {
  __widgets?: Array<{ start: number; widget: CodeMirror.LineWidget }>;
  __groupsCache?: EditorGroup[];
  __highlightedLines?: number[];
  // Model used for hints (list of methods and their endpoints)
  model?: DevToolsModel;
  // Optional internal display wrapper access
  display?: { wrapper?: HTMLElement };
}

export type EditorLike = CodeMirror.Editor & DevToolsEditorAugmentations;

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

/**
 * Minimal output editor surface used by actions.
 */
export interface EditorOutputLike {
  setValue(v: string): void;
}
