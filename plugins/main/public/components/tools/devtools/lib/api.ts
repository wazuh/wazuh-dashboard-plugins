import type { SendHooks } from './types/editor';
import { ErrorService } from './services/error-service';
import { WzHttpClient } from './services/wz-http-client';
import { DevToolsActions } from './actions/dev-tools-actions';
import { FileService } from './services/file-service';

// Singleton-ish default actions instance for UI usage
const defaultActions = new DevToolsActions(new WzHttpClient(), new ErrorService());

export const send = (
  editorInput: any,
  editorOutput: any,
  firstTime = false,
  hooks?: SendHooks,
) => defaultActions.send(editorInput, editorOutput, firstTime, hooks);

export function saveEditorContentAsJson(editor: any) {
  try {
    const fileSvc = new FileService();
    fileSvc.saveJson('export.json', editor.getValue());
  } catch (error) {
    const err = new ErrorService();
    err.log({
      context: 'exportOutput',
      error: error as any,
      title: 'Export JSON',
    });
  }
}

