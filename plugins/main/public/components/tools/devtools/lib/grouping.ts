import $ from 'jquery';
import jsonLint from '../../../../utils/codemirror/json-lint';
import { AppState } from '../../../../react-services';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { EditorLike, EditorGroup } from './types';

/**
 * Split the current buffer into request groups (method + path + optional JSON body).
 */
export function analyzeGroups(editor: EditorLike): EditorGroup[] {
  try {
    const currentState = editor.getValue().toString();
    AppState.setCurrentDevTools(currentState);
    const tmpgroups: EditorGroup[] = [];
    const splitted = currentState
      .split(/[\r\n]+(?=(?:GET|PUT|POST|DELETE)\b)/gm)
      .filter(item => item.replace(/\s/g, '').length);

    let start = 0;
    let end = 0;
    let starts: number[] = [];
    const slen = splitted.length;
    for (let i = 0; i < slen; i++) {
      let tmp: string[] = splitted[i].split('\n');
      if (Array.isArray(tmp)) tmp = tmp.filter(item => !item.startsWith('#'));
      const cursor = editor.getSearchCursor!(splitted[i], null, {
        multiline: true,
      });

      if (cursor.findNext()) start = cursor.from().line;
      else return [];

      // Prevent user frustration when there are duplicated queries.
      if (tmp.length) {
        // It's a safe loop since findNext returns false if there is no next query.
        while (
          editor.getLine!(cursor.from().line) !== tmp[0] &&
          cursor.findNext()
        ) {
          start = cursor.from().line;
        }
        // Avoid selecting already-started blocks
        while (starts.includes(start) && cursor.findNext()) {
          start = cursor.from().line;
        }
      }
      starts.push(start);

      end = start + tmp.length;

      const tmpRequestText = tmp[0];
      let tmpRequestTextJson = '';

      const tmplen = tmp.length;
      for (let j = 1; j < tmplen; ++j) {
        if (!!tmp[j] && !tmp[j].startsWith('#')) {
          tmpRequestTextJson += tmp[j];
        }
      }

      if (tmpRequestTextJson && typeof tmpRequestTextJson === 'string') {
        let rtjlen = tmp.length;
        while (rtjlen--) {
          if (tmp[rtjlen].trim() === '}') break;
          else end -= 1;
        }
      }

      if (!tmpRequestTextJson && tmp.length > 1) {
        tmp = [tmp[0]];
        end = start + 1;
      }

      if (i === slen - 1 && !tmpRequestTextJson) {
        if (tmp.length > 1) end -= tmp.length - 1;
      }

      end--;

      tmpgroups.push({
        requestText: tmpRequestText,
        requestTextJson: tmpRequestTextJson,
        start,
        end,
      });
    }
    starts = [];
    return tmpgroups;
  } catch (error: any) {
    const options: UIErrorLog = {
      context: `analyzeGroups`,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      error: {
        error: error,
        message: error.message || error,
        title: error.name || error,
      },
    };
    getErrorOrchestrator().handleError(options);
    return [];
  }
}

/**
 * Choose which group is active based on the cursor position and place action buttons.
 */
export function calculateWhichGroup(
  editor: any,
  firstTime = false,
  groups: EditorGroup[] = [],
): EditorGroup | null {
  try {
    const selection = editor.getCursor();
    const validGroups = groups.filter(item => {
      return item.requestText;
    });
    const desiredGroup = firstTime
      ? (validGroups as any)
      : validGroups.filter(item => {
          return (
            item.requestText &&
            item.end >= selection.line &&
            item.start <= selection.line
          );
        });

    if (desiredGroup.length === 0 && validGroups.length > 0) {
      (desiredGroup as any).push(validGroups[0]);
    }

    // Place action buttons at the first line from the selected group
    let cords;
    try {
      cords = editor.cursorCoords({
        line: desiredGroup[0]?.start,
        ch: 0,
      });
    } catch {
      $('#wz-dev-tools-buttons--send-request').hide();
      $('#wz-dev-tools-buttons--go-to-api-reference').hide();
      return null;
    }

    if (!$('#wz-dev-tools-buttons--send-request').is(':visible')) {
      $('#wz-dev-tools-buttons--send-request').show();
    }
    if (!$('#wz-dev-tools-buttons--go-to-api-reference').is(':visible')) {
      $('#wz-dev-tools-buttons--go-to-api-reference').show();
    }
    $('#wz-dev-tools-buttons--send-request').offset({
      top: cords.top + 1,
    });
    $('#wz-dev-tools-buttons--go-to-api-reference').offset({
      top: cords.top + 1,
    });

    if (firstTime) highlightGroup(editor, desiredGroup[0]);

    if (desiredGroup[0]) {
      const [inputRequest, inputHttpMethod, inputPath, inputQueryParamsStart] =
        (desiredGroup[0] &&
          desiredGroup[0].requestText &&
          desiredGroup[0].requestText.match(
            /^(GET|PUT|POST|DELETE) ([^\?]*)(\?)?(\S+)?/,
          )) ||
        [];
      // Split the input request path as array and lowercase
      const inputEndpoint =
        (inputPath &&
          inputPath
            .split('/')
            .filter((item: string) => item)
            .map((item: string) => item.toLowerCase())) ||
        [];
      // Get all API endpoints with http method in the request
      const inputHttpMethodEndpoints =
        (editor.model.find((item: any) => item.method === inputHttpMethod) || {})
          .endpoints || [];
      // Find the API endpoint in the request
      const apiEndpoint = inputHttpMethodEndpoints
        .map((endpoint: any) => ({
          ...endpoint,
          splitURL: endpoint.name.split('/').filter((item: string) => item),
        }))
        .filter((endpoint: any) => endpoint.splitURL.length === inputEndpoint.length)
        .find((endpoint: any) =>
          endpoint.splitURL.reduce(
            (accum: boolean, str: string, index: number) =>
              accum &&
              (str.startsWith(':')
                ? true
                : str.toLowerCase() === inputEndpoint[index]),
            true,
          ),
        );
      if (apiEndpoint && apiEndpoint.documentation) {
        $('#wz-dev-tools-buttons--go-to-api-reference')
          .attr('href', apiEndpoint.documentation)
          .show();
      } else {
        $('#wz-dev-tools-buttons--go-to-api-reference').attr('href', '').hide();
      }
    }
    return desiredGroup[0] || null;
  } catch (error: any) {
    $('#wz-dev-tools-buttons--send-request').hide();
    $('#wz-dev-tools-buttons--go-to-api-reference').hide();
    const options: UIErrorLog = {
      context: `calculateWhichGroup`,
      level: UI_LOGGER_LEVELS.WARNING as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      error: {
        error: error,
        message: error.message || error,
        title: error.name,
      },
    };
    getErrorOrchestrator().handleError(options);

    return null;
  }
}

/**
 * Mark the given group as active by highlighting its lines.
 */
export function highlightGroup(editor: any, group?: EditorGroup) {
  editor.eachLine((line: any) =>
    editor.removeLineClass(line, 'background', 'CodeMirror-styled-background'),
  );
  if (group) {
    if (
      !group.requestTextJson ||
      (group.requestText.includes('{') && group.requestText.includes('}'))
    ) {
      editor.addLineClass(
        group.start,
        'background',
        'CodeMirror-styled-background',
      );
      return;
    }
    for (let i = group.start; i <= group.end; i++) {
      editor.addLineClass(i, 'background', 'CodeMirror-styled-background');
    }
  }
}

/**
 * Validate JSON structure for all groups and render error widgets.
 */
export function checkJsonParseError(editor: any, groups: EditorGroup[] = []) {
  const affectedGroups: string[] = [];
  for (const widget of editor.__widgets) {
    editor.removeLineWidget(widget.widget);
  }
  editor.__widgets = [];
  for (const item of groups) {
    if (item.requestTextJson) {
      try {
        jsonLint.parse(item.requestTextJson);
      } catch (error: any) {
        affectedGroups.push(item.requestText);
        const msg = window.document.createElement('div');
        msg.id = String(new Date().getTime() / 1000);
        const icon = msg.appendChild(window.document.createElement('div'));

        icon.className = 'lint-error-icon';
        icon.id = String(new Date().getTime() / 1000);
        icon.onmouseover = () => {
          const advice = msg.appendChild(window.document.createElement('span'));
          advice.id = String(new Date().getTime() / 1000);
          advice.innerText = error.message || 'Error parsing query';
          advice.className = 'lint-block-wz';
        };

        icon.onmouseleave = () => {
          msg.removeChild(msg.lastChild as Node);
        };

        editor.__widgets.push({
          start: item.start,
          widget: editor.addLineWidget(item.start, msg, {
            coverGutter: false,
            noHScroll: true,
          }),
        });
      }
    }
  }
  return affectedGroups;
}

