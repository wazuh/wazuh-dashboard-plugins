/**
 * UI constants for dictionary hint rendering and labels.
 */
export const HINT_WRAPPER_CLASS = 'wz-hint';
export const HINT_TEXT_CLASS = 'wz-hint__text';
export const HINT_LABEL_CLASS = 'wz-hint__label';

export const LABEL_ENDPOINT = 'endpoint';
export const LABEL_PARAM = 'param';
export const LABEL_FLAG = 'flag';

/**
 * Body-line start matcher for JSON key suggestions.
 * Captures indentation and typed key prefix.
 */
export const BODY_LINE_START_RE = /^(\s*)(?:\"|')(\S*)(?::)?$/;
