import {
  HINT_LABEL_CLASS,
  HINT_TEXT_CLASS,
  HINT_WRAPPER_CLASS,
} from '../constants';

/**
 * Create a CodeMirror hint render function with a right-aligned label.
 */
export function createHintRenderer(label: string) {
  return (
    containerElement: HTMLElement,
    _data: unknown,
    currentHint: { text?: string; displayText?: string } | string,
  ) => {
    try {
      const wrap = document.createElement('div');
      wrap.className = HINT_WRAPPER_CLASS;
      const left = document.createElement('span');
      left.className = HINT_TEXT_CLASS;
      const hintObject =
        typeof currentHint === 'string' ? { text: currentHint } : currentHint;
      left.textContent = hintObject.displayText || hintObject.text || '';
      const right = document.createElement('span');
      right.className = HINT_LABEL_CLASS;
      right.textContent = label;
      wrap.appendChild(left);
      wrap.appendChild(right);
      containerElement.appendChild(wrap);
    } catch (_e) {
      // Fallback to simple text rendering if DOM manipulation fails
      const fallbackText =
        typeof currentHint === 'string'
          ? currentHint
          : currentHint?.displayText || currentHint?.text || '';
      containerElement.appendChild(document.createTextNode(fallbackText));
    }
  };
}
