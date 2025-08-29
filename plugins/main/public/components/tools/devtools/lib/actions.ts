import queryString from 'query-string';
import { WzRequest, ErrorHandler } from '../../../../react-services';
import * as FileSaver from '../../../../services/file-saver';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import {
  analyzeGroups,
  calculateWhichGroup,
  checkJsonParseError,
} from './grouping';

/**
 * Perform the request defined in the active group and render the response.
 */
export async function send(
  editorInput: any,
  editorOutput: any,
  firstTime = false,
) {
  try {
    const groups = analyzeGroups(editorInput);
    const desiredGroup = calculateWhichGroup(editorInput, firstTime, groups);

    if (desiredGroup) {
      if (firstTime) {
        const cords = editorInput.cursorCoords({
          line: desiredGroup.start,
          ch: 0,
        });
        // keep buttons aligned with selection on first render
        (window as any).$('#wz-dev-tools-buttons--send-request')?.offset?.({
          top: cords.top + 1,
        });
        (window as any)
          .$('#wz-dev-tools-buttons--go-to-api-reference')
          ?.offset?.({
            top: cords.top + 1,
          });
      }

      const affectedGroups = checkJsonParseError(editorInput, groups);
      const filteredAffectedGroups = affectedGroups.filter(
        item => item === desiredGroup.requestText,
      );
      if (filteredAffectedGroups.length) {
        editorOutput.setValue('Error parsing JSON query');
        return;
      }

      const method = desiredGroup.requestText.startsWith('GET')
        ? 'GET'
        : desiredGroup.requestText.startsWith('POST')
        ? 'POST'
        : desiredGroup.requestText.startsWith('PUT')
        ? 'PUT'
        : desiredGroup.requestText.startsWith('DELETE')
        ? 'DELETE'
        : 'GET';

      let requestCopy = desiredGroup.requestText.includes(method)
        ? desiredGroup.requestText.split(method)[1].trim()
        : desiredGroup.requestText;

      // Checks for inline parameters
      let paramsInline: string | false = false;
      if (requestCopy.includes('{') && requestCopy.includes('}')) {
        paramsInline = `{${requestCopy.split('{')[1]}`;
        requestCopy = requestCopy.split('{')[0];
      }
      const inlineSplit = requestCopy.split('?');

      const extra =
        inlineSplit && inlineSplit[1] ? queryString.parse(inlineSplit[1]) : {};

      const req = requestCopy
        ? requestCopy.startsWith('/')
          ? requestCopy
          : `/${requestCopy}`
        : '/';

      let JSONraw: any = {};
      try {
        JSONraw = JSON.parse(
          (paramsInline as string) || desiredGroup.requestTextJson,
        );
      } catch (error) {
        JSONraw = {};
      }

      if (typeof (extra as any).pretty !== 'undefined')
        delete (extra as any).pretty;
      if (typeof JSONraw.pretty !== 'undefined') delete JSONraw.pretty;

      if (typeof JSONraw === 'object') JSONraw.devTools = true;
      if (!firstTime) {
        const response = await WzRequest.apiReq(method, req, JSONraw);

        if (
          typeof response === 'string' &&
          (response as string).includes('3029')
        ) {
          editorOutput.setValue(
            'This method is not allowed without admin mode',
          );
        } else {
          editorOutput.setValue(
            JSON.stringify((response || {}).data || {}, null, 2),
          );
        }
      }
    }

    (firstTime || !desiredGroup) && editorOutput.setValue('Welcome!');
  } catch (error: any) {
    const options: UIErrorLog = {
      context: `send`,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      error: {
        error: error,
        message: error.message || error,
        title: error.name,
      },
    };
    getErrorOrchestrator().handleError(options);

    return editorOutput.setValue(parseError(error));
  }
}

/**
 * Normalize and stringify API errors so they’re readable in the output editor.
 */
export function parseError(error: any) {
  if ((error || {}).status === -1) {
    return 'API is not reachable. Reason: timeout.';
  } else {
    const parsedError = ErrorHandler.handle(error, '', { silent: true } as any);
    if (typeof parsedError === 'string') {
      return parsedError;
    } else if (error && error.data && typeof error.data === 'object') {
      return JSON.stringify(error);
    } else {
      return 'Empty';
    }
  }
}

/**
 * Save the content of a CodeMirror editor as a JSON file.
 */
export function saveEditorContentAsJson(editor: any) {
  try {
    // eslint-disable-next-line no-undef
    const blob = new Blob([editor.getValue()], {
      type: 'application/json',
    });
    FileSaver.saveAs?.(blob, 'export.json');
  } catch (error: any) {
    const options: UIErrorLog = {
      context: `exportOutput`,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      error: {
        error: error,
        message: error.message || error,
        title: `${error.name}: Export JSON`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }
}
