/**
 * Regex helpers for request parsing and grouping.
 */
export const REQUEST_SPLIT_REGEX = /[\r\n]+(?=(?:GET|PUT|POST|DELETE)\b)/gm;

// Captures: method, path, hasQueryMark?, queryString
export const REQUEST_LINE_REGEX = /^(GET|PUT|POST|DELETE) ([^\?]*)(\?)?(\S+)?/;

