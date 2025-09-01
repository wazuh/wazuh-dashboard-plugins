import { LABEL_ENDPOINT, LABEL_FLAG, LABEL_PARAM } from '../constants';
import { createHintRenderer } from './hint-renderer';
import type { HintItem } from '../types';

/** Build a standardized endpoint hint item. */
export function buildEndpointHintItem(name: string): HintItem {
  return {
    text: name,
    displayText: name,
    render: createHintRenderer(LABEL_ENDPOINT),
  };
}

/** Build a standardized query param hint item. */
export function buildQueryParamHintItem(
  display: string,
  nextPath: string,
  isFlag: boolean,
): HintItem {
  return {
    text: nextPath,
    displayText: display,
    render: createHintRenderer(isFlag ? LABEL_FLAG : LABEL_PARAM),
  };
}
