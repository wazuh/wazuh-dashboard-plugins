import type { HintStrategy } from './hint-strategy';
import type { HintItem, MethodDef } from '../types';
import type { HintContext } from '../context';

/**
 * Fallback strategy: return available HTTP methods when no other strategy applies.
 */
export class FallbackHintStrategy implements HintStrategy {
  canHandle(context: HintContext): boolean {
    // Do not suggest methods while editing a JSON body
    if (context.isInsideBodyBlock) return false;

    // Only suggest HTTP methods when the cursor word is at
    // the beginning of the line or after leading spaces.
    // This matches /^($METHODS)/ or /^\s*($METHODS)/ semantics.
    const { editor, line } = context;
    const cur = editor.getCursor ? editor.getCursor() : { line: 0, ch: 0 };

    // Compute the start index of the current word (walk backwards until whitespace)
    let start = cur.ch;
    while (start > 0) {
      const prev = line.charAt(start - 1);
      if (/\s/.test(prev)) break;
      start--;
    }

    // If anything non-space exists before the word start, do not suggest methods
    const head = line.slice(0, start);
    if (!/^\s*$/.test(head)) return false;

    return true;
  }

  getHints(context: HintContext): Array<HintItem | string> {
    return context.model.map((m: MethodDef) => m.method) as Array<string>;
  }
}
