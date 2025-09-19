import $ from 'jquery';
import { DEV_TOOLS_BUTTONS } from '../../../constants';

/**
 * Abstraction over the DevTools action buttons in the DOM.
 * Keeps jQuery/dom specifics outside core logic for testability.
 */
export interface EditorUIController {
  showPlay(): void;
  hidePlay(): void;
  showDocs(href: string): void;
  hideDocs(): void;
  setButtonsTop(top: number): void;
}

/**
 * Default jQuery-based implementation for production UI.
 */
export class JQueryEditorUIController implements EditorUIController {
  showPlay(): void {
    const $el = $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`);
    if (!$el.is(':visible')) $el.show();
  }

  hidePlay(): void {
    $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).hide();
  }

  showDocs(href: string): void {
    const $el = $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`);
    $el.attr('href', href);
    if (!$el.is(':visible')) $el.show();
  }

  hideDocs(): void {
    const $el = $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`);
    $el.attr('href', '');
    $el.hide();
  }

  setButtonsTop(top: number): void {
    $(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`).offset({ top });
    $(`#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`).offset({ top });
  }
}
