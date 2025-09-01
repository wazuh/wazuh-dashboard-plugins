import $ from 'jquery';
import type { EditorGroup, EditorLike } from '../types/editor';
import { REQUEST_SPLIT_REGEX } from '../constants/regex';
import { ErrorService } from '../services/error-service';
import { EDITOR_HIGHLIGHT_CLASS } from '../constants/ui';
import { resolveDocsUrl } from './services/docs-link-resolver';
import type { EditorUIController } from './services/ui-controller';
import { JQueryEditorUIController } from './services/ui-controller';
import type { CurrentStateStore } from './services/state-adapter';
import { DefaultCurrentStateStore } from './services/state-adapter';
import type { JsonLinter } from './services/json-linter';
import { DefaultJsonLinter } from './services/json-linter';

/**
 * Service that encapsulates request grouping logic and related UI hooks.
 * All dependencies are injected for testability; defaults are provided.
 */
export class GroupingService {
  constructor(
    private ui: EditorUIController = new JQueryEditorUIController(),
    private errors = new ErrorService(),
    private state: CurrentStateStore = new DefaultCurrentStateStore(),
    private json: JsonLinter = new DefaultJsonLinter(),
  ) {}

  /**
   * Split the current buffer into request groups (method + path + optional JSON body).
   */
  parseGroups(editor: EditorLike): EditorGroup[] {
    try {
      const currentState = String(editor.getValue() as any);
      this.state.setCurrentDevTools(currentState);

      const tmpgroups: EditorGroup[] = [];
      const splitted = currentState
        .split(REQUEST_SPLIT_REGEX as any)
        .filter(item => item.replace(/\s/g, '').length);

      let start = 0;
      let end = 0;
      let starts: number[] = [];
      const slen = splitted.length;
      for (let i = 0; i < slen; i++) {
        let tmp: string[] = splitted[i].split('\n');
        if (Array.isArray(tmp)) tmp = tmp.filter(item => !item.startsWith('#'));
        const cursor = editor.getSearchCursor?.(splitted[i], null, {
          multiline: true,
        });

        if (cursor && cursor.findNext()) start = cursor.from().line;
        else return [];

        if (tmp.length) {
          while (
            editor.getLine?.(cursor.from().line) !== tmp[0] &&
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
      this.errors.log({ context: 'parseGroups', error });
      return [];
    }
  }

  /**
   * Choose which group is active based on the cursor position and place action buttons.
   */
  selectActiveGroup(
    editor: EditorLike,
    firstTime = false,
    groups: EditorGroup[] = [],
  ): EditorGroup | null {
    try {
      const selection = editor.getCursor();
      const validGroups = groups.filter(item => item.requestText);
      let desiredGroup: any = firstTime
        ? (validGroups as any)
        : validGroups.filter(item =>
            item.requestText && item.end >= selection.line && item.start <= selection.line,
          );

      if (!firstTime && desiredGroup.length === 0) {
        try {
          const wrapperEl = editor.getWrapperElement?.() || editor.display?.wrapper || null;
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
          this.ui.hidePlay();
          this.ui.hideDocs();
          return null;
        }
      }

      let cords: any;
      try {
        cords = editor.cursorCoords({ line: desiredGroup[0]?.start, ch: 0 });
      } catch {
        this.ui.hidePlay();
        this.ui.hideDocs();
        return null;
      }

      if (desiredGroup[0]) {
        try {
          const wrapperEl = editor.getWrapperElement?.() || editor.display?.wrapper || null;
          const $wrapper = wrapperEl ? $(wrapperEl) : null;
          const wrapperTop = $wrapper?.offset()?.top ?? 0;
          const wrapperHeight = $wrapper?.outerHeight?.() ?? 0;
          const wrapperBottom = wrapperTop + wrapperHeight;

          const lineTop = cords.top + 1;

          const isVisible = lineTop >= wrapperTop && lineTop <= wrapperBottom;

          if (!isVisible) {
            this.ui.hidePlay();
            this.ui.hideDocs();
          } else {
            this.ui.showPlay();
            this.ui.showDocs(resolveDocsUrl(editor as any, desiredGroup[0].requestText) || '');
            this.ui.setButtonsTop(lineTop);
          }
        } catch {
          this.ui.hidePlay();
          this.ui.hideDocs();
        }
      }

      if (firstTime) this.highlightGroup(editor, desiredGroup[0]);

      // Validate and toggle docs/play if no doc url is available
      if (desiredGroup[0]) {
        const url = resolveDocsUrl(editor as any, desiredGroup[0].requestText);
        if (url) {
          this.ui.showDocs(url);
          this.ui.showPlay();
        } else {
          this.ui.hideDocs();
          this.ui.hidePlay();
        }
      }

      return desiredGroup[0] || null;
    } catch (error: any) {
      this.ui.hidePlay();
      this.ui.hideDocs();
      this.errors.log({ context: 'selectActiveGroup', error, level: undefined });
      return null;
    }
  }

  /**
   * Mark the given group as active by highlighting its lines.
   */
  highlightGroup(editor: EditorLike, group?: EditorGroup) {
    if (!(editor as any).__highlightedLines) {
      (editor as any).__highlightedLines = [] as number[];
    }

    for (const lineNo of (editor as any).__highlightedLines) {
      editor.removeLineClass?.(lineNo, 'background', EDITOR_HIGHLIGHT_CLASS);
    }
    (editor as any).__highlightedLines = [];

    if (!group) return;

    const add = (ln: number) => {
      editor.addLineClass?.(ln, 'background', EDITOR_HIGHLIGHT_CLASS);
      (editor as any).__highlightedLines.push(ln);
    };

    if (!group.requestTextJson || (group.requestText.includes('{') && group.requestText.includes('}'))) {
      add(group.start);
      return;
    }

    for (let i = group.start; i <= group.end; i++) add(i);
  }

  /**
   * Validate JSON structure for all groups and render error widgets.
   * Returns the list of requestText identifiers that failed.
   */
  validateJson(editor: EditorLike, groups: EditorGroup[] = []): string[] {
    const affectedGroups: string[] = [];
    for (const widget of (editor as any).__widgets || []) {
      editor.removeLineWidget?.(widget.widget);
    }
    (editor as any).__widgets = [];
    for (const item of groups) {
      if (item.requestTextJson) {
        try {
          this.json.parse(item.requestTextJson);
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
            advice.innerText = (error?.message as string) || 'Error parsing query';
            advice.className = 'lint-block-wz';
          };

          icon.onmouseleave = () => {
            if (msg.lastChild) msg.removeChild(msg.lastChild as Node);
          };

          (editor as any).__widgets.push({
            start: item.start,
            widget: editor.addLineWidget?.(item.start, msg, {
              coverGutter: false,
              noHScroll: true,
            }),
          });
        }
      }
    }
    return affectedGroups;
  }
}

