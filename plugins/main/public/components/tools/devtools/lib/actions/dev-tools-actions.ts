import queryString from 'query-string';
import { HTTP_METHODS, DEFAULT_HTTP_METHOD } from '../constants/http';
import type { EditorLike, SendHooks } from '../types/editor';
import type { HttpClient } from '../types/http';
import { ErrorService } from '../services/error-service';
import { parseErrorForOutput } from '../adapters/error-adapter';
import {
  analyzeGroups,
  calculateWhichGroup,
  checkJsonParseError,
} from '../grouping';
import { DEV_TOOLS_BUTTONS } from '../../constants';
import { safeJsonParse, stripReservedFlags } from '../utils/json';

/**
 * Encapsulates side-effectful actions for DevTools.
 * Dependencies are injected for testability.
 */
export class DevToolsActions {
  constructor(private http: HttpClient, private errors = new ErrorService()) {}

  async send(
    editorInput: EditorLike,
    editorOutput: any,
    firstTime = false,
    hooks?: SendHooks,
  ) {
    try {
      const groups = analyzeGroups(editorInput as any);
      const desiredGroup = calculateWhichGroup(
        editorInput as any,
        firstTime,
        groups,
      );

      if (desiredGroup) {
        if (firstTime) {
          const cords = editorInput.cursorCoords({
            line: desiredGroup.start,
            ch: 0,
          });
          (window as any)
            .$(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`)
            ?.offset?.({ top: cords.top + 1 });
          (window as any)
            .$(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`)
            ?.offset?.({ top: cords.top + 1 });
        }

        const affectedGroups = checkJsonParseError(editorInput as any, groups);
        const hasJsonError = affectedGroups.some(
          item => item === desiredGroup.requestText,
        );
        if (hasJsonError) {
          editorOutput.setValue('Error parsing JSON query');
          return;
        }

        const method =
          HTTP_METHODS.find(m => desiredGroup.requestText.startsWith(m)) ||
          DEFAULT_HTTP_METHOD;

        let requestCopy = desiredGroup.requestText.includes(method)
          ? desiredGroup.requestText.split(method)[1].trim()
          : desiredGroup.requestText;

        // Inline body handling: e.g. POST /path { ... }
        let paramsInline: string | false = false;
        if (requestCopy.includes('{') && requestCopy.includes('}')) {
          paramsInline = `{${requestCopy.split('{')[1]}`;
          requestCopy = requestCopy.split('{')[0];
        }
        const inlineSplit = requestCopy.split('?');
        const extra =
          inlineSplit && inlineSplit[1]
            ? (queryString.parse(inlineSplit[1]) as Record<string, any>)
            : {};

        const req = requestCopy
          ? requestCopy.startsWith('/')
            ? requestCopy
            : `/${requestCopy}`
          : '/';

        let JSONraw: any = safeJsonParse(
          (paramsInline as string) || desiredGroup.requestTextJson,
          {},
        );
        delete (extra as any).pretty; // ensure pretty is not forwarded in query
        JSONraw = stripReservedFlags(JSONraw);

        if (typeof JSONraw === 'object') JSONraw.devTools = true;

        if (!firstTime) {
          const start = Date.now();
          hooks?.onStart?.();
          const response = await this.http.request(
            method as any,
            req,
            JSONraw,
            {
              returnOriginalResponse: true,
            },
          );

          if (
            typeof response === 'string' &&
            (response as string).includes('3029')
          ) {
            editorOutput.setValue(
              'This method is not allowed without admin mode',
            );
            hooks?.onEnd?.({
              status: undefined,
              statusText: 'Forbidden without admin mode',
              durationMs: Date.now() - start,
              ok: false,
            });
            return;
          }

          const res: any = response || {};
          const body = res.data || {};
          editorOutput.setValue(JSON.stringify(body, null, 2));

          const hasPayloadError = !!(body && body.error);
          const status = res.status;
          const statusText = res.statusText;
          hooks?.onEnd?.({
            status,
            statusText,
            durationMs: Date.now() - start,
            ok: !hasPayloadError && status >= 200 && status < 300,
          });
        }
      }

      if (firstTime) editorOutput.setValue('Welcome!');
    } catch (error: any) {
      this.errors.log({ context: 'send', error });
      try {
        editorOutput.setValue(parseErrorForOutput(error));
      } finally {
        const status = (error || {}).response?.status;
        const statusText = (error || {}).response?.statusText || error?.message;
        hooks?.onEnd?.({ status, statusText, durationMs: 0, ok: false });
      }
    }
  }
}

// Convenience functional wrappers used by UI code
import { WzHttpClient } from '../services/wz-http-client';
const defaultActions = new DevToolsActions(new WzHttpClient());

export const send = (
  editorInput: any,
  editorOutput: any,
  firstTime = false,
  hooks?: SendHooks,
) => defaultActions.send(editorInput, editorOutput, firstTime, hooks);

export { parseErrorForOutput as parseError } from '../adapters/error-adapter';

import { FileService } from '../services/file-service';
const fileSvc = new FileService();
export function saveEditorContentAsJson(editor: any) {
  try {
    fileSvc.saveJson('export.json', editor.getValue());
  } catch (error) {
    // Non-critical; rely on global error handler
    const err = new ErrorService();
    err.log({
      context: 'exportOutput',
      error: error as any,
      title: 'Export JSON',
    });
  }
}
