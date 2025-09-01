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
        const affectedGroups = this.grouping.validateJson(editorInput as any, groups);
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

          if (this.responses.isAdminModeForbidden(response)) {
            editorOutput.setValue(MESSAGES.ADMIN_MODE_REQUIRED);
            hooks?.onEnd?.({
              status: undefined,
              statusText: MESSAGES.ADMIN_MODE_REQUIRED_SHORT,
              durationMs: Date.now() - start,
              ok: false,
            });
            return;
          }

          const { body, status, statusText, ok } = this.responses.normalize(
            response,
          );
          editorOutput.setValue(JSON.stringify(body, null, 2));
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
