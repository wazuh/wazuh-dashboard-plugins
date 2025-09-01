import type { HintStrategy } from './hint-strategy';
import type { HintItem, MethodDef } from '../types';
import type { HintContext } from '../context';

/**
 * Fallback strategy: return available HTTP methods when no other strategy applies.
 */
export class FallbackHintStrategy implements HintStrategy {
  canHandle(_context: HintContext): boolean {
    return true;
  }

  getHints(context: HintContext): Array<HintItem | string> {
    return context.model.map((m: MethodDef) => m.method) as Array<string>;
  }
}
