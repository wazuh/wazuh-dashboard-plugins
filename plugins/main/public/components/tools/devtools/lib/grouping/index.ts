import $ from 'jquery';
import jsonLint from '../../../../../utils/codemirror/json-lint';
import CodeMirror from '../../../../../utils/codemirror/lib/codemirror';
import { AppState } from '../../../../../react-services';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { DEV_TOOLS_BUTTONS } from '../../constants';
import { REQUEST_LINE_REGEX, REQUEST_SPLIT_REGEX } from '../constants/regex';

/**
 * Split the current buffer into request groups (method + path + optional JSON body).
 */
export function analyzeGroups(
  editor: CodeMirror.EditorLike,
): CodeMirror.EditorGroup[] {
  try {
    const currentState = editor.getValue().toString();
    AppState.setCurrentDevTools(currentState);
    const tmpgroups: CodeMirror.EditorGroup[] = [];
    const splitted = currentState
      .split(REQUEST_SPLIT_REGEX)
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

      if (tmp.length) {
        while (
          editor.getLine!(cursor.from().line) !== tmp[0] &&
          cursor.findNext()
        ) {
          start = cursor.from().line;
        }
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
  groups: CodeMirror.EditorGroup[] = [],
): CodeMirror.EditorGroup | null {
  try {
    const selection = editor.getCursor();
    const validGroups = groups.filter(item => {
      return item.requestText;
    });
    let desiredGroup = firstTime
      ? (validGroups as any)
      : validGroups.filter(item => {
          return (
            item.requestText &&
            item.end >= selection.line &&
            item.start <= selection.line
          );
        });

    if (!firstTime && desiredGroup.length === 0) {
      try {
        const wrapperEl =
          editor.getWrapperElement?.() || editor.display?.wrapper || null;
        const $wrapper = wrapperEl ? $(wrapperEl) : null;
        const wrapperTop = $wrapper?.offset()?.top ?? 0;
        const wrapperHeight = $wrapper?.outerHeight?.() ?? 0;
        const wrapperBottom = wrapperTop + wrapperHeight;

        const firstVisible = validGroups.find(g => {
          try {
            const c = editor.cursorCoords({ line: g.start, ch: 0 });
            const lineTop = c.top + 1;
            return lineTop >= wrapperTop && lineTop <= wrapperBottom;
          } catch {
            return false;
          }
        });

        if (firstVisible) {
          desiredGroup = [firstVisible] as any;
        } else if (validGroups.length) {
          desiredGroup = [validGroups[0]] as any;
        }
      } catch {}

      if (!desiredGroup.length) {
        $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).hide();
        $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).hide();
        return null;
      }
    }

    let cords;
    try {
      cords = editor.cursorCoords({
        line: desiredGroup[0]?.start,
        ch: 0,
      });
    } catch {
      $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).hide();
      $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).hide();
      return null;
    }

    if (desiredGroup[0]) {
      try {
        const wrapperEl =
          editor.getWrapperElement?.() || editor.display?.wrapper || null;
        const $wrapper = wrapperEl ? $(wrapperEl) : null;
        const wrapperTop = $wrapper?.offset()?.top ?? 0;
        const wrapperHeight = $wrapper?.outerHeight?.() ?? 0;
        const wrapperBottom = wrapperTop + wrapperHeight;

        const lineTop = cords.top + 1;

        const isVisible = lineTop >= wrapperTop && lineTop <= wrapperBottom;

        if (!isVisible) {
          $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).hide();
          $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).hide();
        } else {
          if (!$(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).is(':visible')) {
            $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).show();
          }
          if (!$(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).is(':visible')) {
            $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).show();
          }
          $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).offset({ top: lineTop });
          $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).offset({ top: lineTop });
        }
      } catch {
        $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).hide();
        $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).hide();
      }
    }

    if (firstTime) highlightGroup(editor, desiredGroup[0]);

    if (desiredGroup[0]) {
      const [inputRequest, inputHttpMethod, inputPath, inputQueryParamsStart] =
        (desiredGroup[0] &&
          desiredGroup[0].requestText &&
          desiredGroup[0].requestText.match(REQUEST_LINE_REGEX)) ||
        [];
      const inputEndpoint =
        (inputPath &&
          inputPath
            .split('/')
            .filter((item: string) => item)
            .map((item: string) => item.toLowerCase())) ||
        [];
      const inputHttpMethodEndpoints =
        (
          editor.model.find((item: any) => item.method === inputHttpMethod) ||
          {}
        ).endpoints || [];
      const apiEndpoint = inputHttpMethodEndpoints
        .map((endpoint: any) => ({
          ...endpoint,
          splitURL: endpoint.name.split('/').filter((item: string) => item),
        }))
        .filter(
          (endpoint: any) => endpoint.splitURL.length === inputEndpoint.length,
        )
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
        $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`)
          .attr('href', apiEndpoint.documentation)
          .show();
        $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).show();
      } else {
        $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).attr('href', '').hide();
        $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).hide();
      }
    }
    return desiredGroup[0] || null;
  } catch (error: any) {
    $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).hide();
    $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).hide();
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
export function highlightGroup(editor: any, group?: CodeMirror.EditorGroup) {
  if (!editor.__highlightedLines) {
    editor.__highlightedLines = [] as number[];
  }

  for (const lineNo of editor.__highlightedLines) {
    editor.removeLineClass(
      lineNo,
      'background',
      'CodeMirror-styled-background',
    );
  }
  editor.__highlightedLines = [];

  if (!group) return;

  const add = (ln: number) => {
    editor.addLineClass(ln, 'background', 'CodeMirror-styled-background');
    editor.__highlightedLines.push(ln);
  };

  if (
    !group.requestTextJson ||
    (group.requestText.includes('{') && group.requestText.includes('}'))
  ) {
    add(group.start);
    return;
  }

  for (let i = group.start; i <= group.end; i++) add(i);
}

/**
 * Validate JSON structure for all groups and render error widgets.
 */
export function checkJsonParseError(
  editor: any,
  groups: CodeMirror.EditorGroup[] = [],
) {
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
