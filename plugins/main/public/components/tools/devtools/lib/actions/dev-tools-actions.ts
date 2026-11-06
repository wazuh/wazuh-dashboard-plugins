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
  }): string {
    const { body, status, statusText, fallbackMessage } = input || {};

    // Show the API error body as is, as the Indexer Dev Tools does
    if (body && typeof body === 'object') {
      return JSON.stringify(body, null, 2);
    }

    // Without a body, build message strictly from HTTP status code and text
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

    let errorPayload: string | undefined;
    if (typeof status === 'number') {
      errorPayload = String(status);
    } else if (fallbackMessage) {
      errorPayload = fallbackMessage;
    }

    return JSON.stringify(
      {
        error: errorPayload || 'Unknown',
        message: message || 'Unknown error',
      },
      null,
      2,
    );
  }

  async send(
    editorInput: EditorLike,
    editorOutput: EditorOutputLike,
    firstTime = false,
    hooks?: SendHooks,
  ) {
    let start: number | undefined;
    try {
      const groups = this.grouping.parseGroups(editorInput);
      const desiredGroup = this.grouping.selectActiveGroup(
        editorInput,
        firstTime,
        groups,
      );

      if (desiredGroup) {
        const affectedGroups = this.grouping.validateJson(editorInput, groups);
        const hasJsonError = affectedGroups.some(
          item => item === desiredGroup.requestText,
        );
        if (hasJsonError) {
          editorOutput.setValue(MESSAGES.ERROR_PARSING_JSON);
          return;
        }
        const built = this.requests.build(desiredGroup);

        if (!firstTime) {
          start = Date.now();
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
            editorOutput.setValue(
              this.buildErrorOutput({ body, status, statusText }),
            );
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
    } catch (error: unknown) {
      this.errors.log({ context: 'send', error });
      const resp = (error as any)?.response;
      const status = resp?.status;
      const statusText = resp?.statusText || (error as any)?.message;
      const body = resp?.data;
      editorOutput.setValue(
        this.buildErrorOutput({
          body,
          status,
          statusText,
          fallbackMessage: parseErrorForOutput(error as any),
        }),
      );
      hooks?.onEnd?.({
        status,
        statusText,
        durationMs: start === undefined ? 0 : Date.now() - start,
        ok: false,
      });
    }
  }
}
