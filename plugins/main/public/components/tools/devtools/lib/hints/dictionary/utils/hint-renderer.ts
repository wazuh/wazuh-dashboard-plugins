import { HINT_LABEL_CLASS, HINT_TEXT_CLASS, HINT_WRAPPER_CLASS } from '../constants';

/**
 * Create a CodeMirror hint render function with a right-aligned label.
 */
export function createHintRenderer(label: string) {
  return (elt: HTMLElement, _data: any, cur: any) => {
    try {
      const wrap = document.createElement('div');
      wrap.className = HINT_WRAPPER_CLASS;
      const left = document.createElement('span');
      left.className = HINT_TEXT_CLASS;
      left.textContent = cur.displayText || cur.text || '';
      const right = document.createElement('span');
      right.className = HINT_LABEL_CLASS;
      right.textContent = label;
      wrap.appendChild(left);
      wrap.appendChild(right);
      elt.appendChild(wrap);
    } catch (_e) {
      elt.appendChild(
        document.createTextNode((cur.displayText || cur.text || '') as string),
      );
    }
  };
}

