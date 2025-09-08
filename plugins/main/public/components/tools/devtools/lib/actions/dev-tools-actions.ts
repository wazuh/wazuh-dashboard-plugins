import type { EditorLike, EditorOutputLike, SendHooks } from '../types/editor';
import type { HttpClient } from '../types/http';
import { ErrorService } from '../services/error-service';
import { parseErrorForOutput } from '../adapters/error-adapter';
import { GroupingService } from '../grouping';
import { RequestBuilder } from '../services/request-builder';
import { ResponseHandler } from '../services/response-handler';
import { MESSAGES } from '../constants/messages';

/**
 * Encapsulates side-effectful actions for DevTools.
 * Dependencies are injected for testability.
 */
export class DevToolsActions {
  constructor(
    private http: HttpClient,
    private errors = new ErrorService(),
    private requests = new RequestBuilder(),
    private responses = new ResponseHandler(),
    private grouping = new GroupingService(),
  ) {}

  private buildErrorOutput(input: {
    body?: any;
    status?: number;
    statusText?: string;
    fallbackMessage?: string;
  }): { error: string; message: string } {
    const { body, status, statusText, fallbackMessage } = input || {};

    // Build message strictly from HTTP status code and text when available
    let message: string | undefined;
    if (
      typeof status === 'number' &&
      typeof statusText === 'string' &&
      statusText.length
    ) {
      message = `${status} - ${statusText}`;
    } else if (typeof status === 'number') {
      message = String(status);
    } else if (typeof statusText === 'string' && statusText.length) {
      message = statusText;
    } else if (fallbackMessage) {
      message = fallbackMessage;
    }

    // Build error field using API error code when available
    // - If body is an object with `error`, use it as code
    // - Otherwise, fall back to HTTP status code or to fallback message
    let errorPayload: string | undefined;
    if (
      body &&
      typeof body === 'object' &&
      (body as any).error !== undefined &&
      (body as any).error !== null
    ) {
      const maybeCode = (body as any).error;
      errorPayload = String(maybeCode);
    } else if (typeof status === 'number') {
      errorPayload = String(status);
    } else if (fallbackMessage) {
      errorPayload = fallbackMessage;
    }

    return {
      error: errorPayload || 'Unknown',
      message: message || 'Unknown error',
    };
  }

  async send(
    editorInput: EditorLike,
    editorOutput: EditorOutputLike,
    firstTime = false,
    hooks?: SendHooks,
  ) {
    try {
      const groups = this.grouping.parseGroups(editorInput as any);
      const desiredGroup = this.grouping.selectActiveGroup(
        editorInput as any,
        firstTime,
        groups,
      );

      if (desiredGroup) {
        const affectedGroups = this.grouping.validateJson(
          editorInput as any,
          groups,
        );
        const hasJsonError = affectedGroups.some(
          item => item === desiredGroup.requestText,
        );
        if (hasJsonError) {
          editorOutput.setValue(MESSAGES.ERROR_PARSING_JSON);
          return;
        }
        const built = this.requests.build(desiredGroup);

        if (!firstTime) {
          const start = Date.now();
          hooks?.onStart?.();
          const response = await this.http.request(
            built.method,
            built.path,
            built.body,
            { returnOriginalResponse: true },
          );

          if (this.responses.isPermissionsForbidden(response)) {
            editorOutput.setValue(MESSAGES.INSUFFICIENT_PERMISSIONS);
            hooks?.onEnd?.({
              status: undefined,
              statusText: MESSAGES.INSUFFICIENT_PERMISSIONS_SHORT,
              durationMs: Date.now() - start,
              ok: false,
            });
            return;
          }

          const { body, status, statusText, ok } =
            this.responses.normalize(response);
          if (ok) {
            editorOutput.setValue(JSON.stringify(body, null, 2));
          } else {
            const out = this.buildErrorOutput({ body, status, statusText });
            editorOutput.setValue(JSON.stringify(out, null, 2));
          }
          hooks?.onEnd?.({
            status,
            statusText,
            durationMs: Date.now() - start,
            ok,
          });
        }
      }

      if (firstTime) editorOutput.setValue(MESSAGES.WELCOME);
    } catch (error: any) {
      this.errors.log({ context: 'send', error });
      const resp = (error || {}).response;
      const status = resp?.status;
      const statusText = resp?.statusText || error?.message;
      const body = resp?.data;
      const out = this.buildErrorOutput({
        body,
        status,
        statusText,
        fallbackMessage: parseErrorForOutput(error),
      });
      editorOutput.setValue(JSON.stringify(out, null, 2));
      hooks?.onEnd?.({ status, statusText, durationMs: 0, ok: false });
    }
  }
}
