import type { HintItem } from '../types';
import type { HintContext } from '../context';

/**
 * Contract for hint strategies. Each strategy states when it can handle
 * a given context and produces a list of hint items accordingly.
 */
export interface HintStrategy {
  canHandle(context: HintContext): boolean;
  getHints(context: HintContext): Array<HintItem | string>;
}

